import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.describe.configure({ mode: "serial" });
const API = "http://127.0.0.1:3001/api";
let admin, season, editable, completed, players, albumPost;
const headers = () => ({ Authorization: `Bearer ${admin.token}` });
const past = {
  title: "Trận kiểm thử A/B",
  location_name: "Sân nội bộ",
  lat: 10.78,
  lng: 106.67,
  start_time: "2026-01-10T18:00:00+07:00",
  lock_time: "2026-01-10T18:15:00+07:00",
  end_time: "2026-01-10T20:00:00+07:00",
};
test.beforeAll(async ({ request }) => {
  admin = await (
    await request.post(`${API}/auth/login`, {
      data: { username: "admin", password: "admin123" },
    })
  ).json();
  players = [];
  for (const [i, name] of [
    "Nguyễn An",
    "Trần Bình",
    "Lê Chi",
    "Võ Dũng",
  ].entries())
    players.push(
      await (
        await request.post(`${API}/users`, {
          headers: headers(),
          data: {
            username: `test${i}`,
            name,
            password: "test123456",
            home_team: i < 2 ? "A" : "B",
          },
        })
      ).json(),
    );
  season = await (
    await request.post(`${API}/seasons`, {
      headers: headers(),
      data: {
        name: "Mùa giải kiểm thử",
        starts_on: "2026-01-01",
        ends_on: "2026-12-31",
      },
    })
  ).json();
  for (let i = 0; i < 14; i++) {
    const m = await (
      await request.post(`${API}/matches`, {
        headers: headers(),
        data: { ...past, title: `Nội bộ buổi ${i + 1}` },
      })
    ).json();
    if (i === 13) editable = m;
    if (i === 0) {
      completed = m;
      await request.put(`${API}/matches/${m.id}/report`, {
        headers: headers(),
        data: {
          revision: 0,
          season_id: season.id,
          status: "completed",
          score_a: 1,
          score_b: 0,
          roster: players.map((p, j) => ({
            userId: p.id,
            team: j < 2 ? "A" : "B",
          })),
          goals: [
            {
              userId: players[0].id,
              assistUserId: players[1].id,
              minute: 15,
              ownGoal: false,
            },
          ],
          mvp_user_id: players[0].id,
          notes: "Biên bản kiểm thử",
        },
      });
    }
  }
});
const signIn = async (page) => {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("fcdbb_token", token);
    localStorage.setItem("fcdbb_user", JSON.stringify(user));
  }, admin);
};

test("login, 12 recent matches, pagination, search and accessible home", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByLabel("Tài khoản", { exact: true }).fill("admin");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sẵn sàng cho trận tiếp theo." }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".match-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.locator(".match-card")).toHaveCount(2);
  await page.getByLabel("Tìm trận hoặc sân").fill("Nội bộ buổi 14");
  await expect(page.locator(".match-card")).toHaveCount(1);

  const kickoff = new Date();
  kickoff.setUTCDate(kickoff.getUTCDate() + 1);
  kickoff.setUTCHours(1, 0, 0, 0);
  const response = await request.post(`${API}/matches`, {
    headers: headers(),
    data: {
      ...past,
      start_time: kickoff,
      lock_time: new Date(kickoff.getTime() + 15 * 60_000),
      end_time: undefined,
    },
  });
  expect(response.ok()).toBe(true);
  const upcoming = await response.json();
  await page.reload();
  await expect(page.locator(".kickoff .match-fact-value")).toHaveText("08:00");
  await expect(page.getByText(/Có thể điểm danh từ 07:30/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    (
      await request.delete(`${API}/matches/${upcoming.id}`, {
        headers: headers(),
      })
    ).ok(),
  ).toBe(true);
});

test("admin records both teams, goal, result and audit; exports CSV and updates standings", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/matches/${editable.id}`);
  await page.getByRole("button", { name: "Lập biên bản" }).click();
  await expect(page.locator(".editor-player")).toHaveCount(0);
  await page.getByRole("button", { name: "Thêm cầu thủ", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm Nguyễn An vào đội A", exact: true })
    .click();
  await page.getByRole("button", { name: "Thêm cầu thủ", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm Trần Bình vào đội B", exact: true })
    .click();
  await page
    .getByLabel("Mùa giải", { exact: true })
    .selectOption(String(season.id));
  await page.getByRole("button", { name: "Thêm bàn", exact: true }).click();
  await page
    .getByLabel("Người ghi bàn", { exact: true })
    .selectOption(String(players[0].id));
  await page.getByText("Phút ghi bàn và phản lưới", { exact: true }).click();
  await page.getByLabel("Phút", { exact: true }).fill("25");
  await page
    .getByRole("button", { name: "Điền tỉ số theo bàn thắng đã ghi" })
    .click();
  await page.getByLabel("Trạng thái biên bản").selectOption("completed");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Lưu và chốt kết quả" }).click();
  await expect(
    page.getByText("Đội A chiến thắng", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".audit-entry")).toHaveCount(2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất biên bản" }).click();
  expect((await download).suggestedFilename()).toContain(".csv");
  await page.getByRole("button", { name: "Chỉnh sửa biên bản" }).click();
  await page.getByLabel("Ghi chú trận đấu").fill("Đã đối chiếu lại");
  await page.getByLabel("Lý do chỉnh sửa (bắt buộc)").fill("Bổ sung ghi chú");
  await page.getByRole("button", { name: "Lưu và chốt kết quả" }).click();
  await expect(page.getByText("Lý do: Bổ sung ghi chú")).toBeVisible();
  await page.goto("/matches");
  await expect(
    page.getByRole("heading", { name: "Cuộc đua hai đội" }),
  ).toBeVisible();
  await page
    .getByLabel("Xem thống kê theo mùa giải")
    .selectOption(String(season.id));
  await expect(page.locator(".match-card")).toHaveCount(2);
  await expect(
    page.getByText("Mùa giải kiểm thử", { exact: true }).first(),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("discard confirmation traps keyboard focus and dismisses with Escape", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/matches/${editable.id}`);
  await page.getByRole("button", { name: "Chỉnh sửa biên bản" }).click();
  await page.getByLabel("Ghi chú trận đấu").fill("Thay đổi chưa lưu");
  await page.getByRole("button", { name: "Hủy chỉnh sửa" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("button").first(),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("dialog").getByRole("button").last(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Ghi chú trận đấu")).toHaveValue(
    "Thay đổi chưa lưu",
  );
});

test("320–1440px layouts fit the viewport and mobile navigation works", async ({
  page,
}) => {
  await signIn(page);
  for (const width of [320, 375, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/matches",
      `/matches/${completed.id}`,
      "/admin",
      "/players",
      "/profile/1",
      "/funds",
      "/blog",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await page
        .locator(".error-state")
        .count()
        .then((n) => expect(n).toBe(0));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${path} at ${width}px should fit`,
      ).toBe(true);
      if (width === 1440 && ["/", "/matches"].includes(path))
        await page.screenshot({
          path: `test-results/${path === "/" ? "home" : "seasons"}-desktop.png`,
          fullPage: true,
        });
      if (width === 375 && path === "/")
        await page.screenshot({
          path: "test-results/home-mobile.png",
          fullPage: true,
        });
    }
    if (width === 375) {
      await page.goto(`/matches/${editable.id}`);
      await page.getByRole("button", { name: "Chỉnh sửa biên bản" }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        "Mobile result editor should fit",
      ).toBe(true);
      await page.goto("/blog");
      await page.getByRole("button", { name: "Mở điều hướng" }).click();
      await page
        .locator(".mobile-nav")
        .getByRole("link", { name: "Trận đấu & mùa giải" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Mỗi trận đấu, một dấu ấn." }),
      ).toBeVisible();
    }
  }
});

test("fixed teams prefill attendance; match loans and later permanent changes stay independent", async ({
  page,
  request,
}) => {
  const now = Date.now();
  const createActive = async () =>
    await (
      await request.post(`${API}/matches`, {
        headers: headers(),
        data: {
          ...past,
          title: "Cân bằng đội theo buổi đá",
          start_time: new Date(now - 600000),
          lock_time: new Date(now + 60000),
          end_time: new Date(now + 3600000),
        },
      })
    ).json();
  const active = await createActive();
  const aToken = (
    await (
      await request.post(`${API}/auth/login`, {
        data: { username: "test0", password: "test123456" },
      })
    ).json()
  ).token;
  const bToken = (
    await (
      await request.post(`${API}/auth/login`, {
        data: { username: "test2", password: "test123456" },
      })
    ).json()
  ).token;
  for (const token of [aToken, bToken])
    expect(
      (
        await request.post(`${API}/attendance/checkin`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { matchId: active.id, lat: 10.78, lng: 106.67 },
        })
      ).ok(),
    ).toBe(true);
  await signIn(page);
  await page.goto(`/matches/${active.id}`);
  await page.getByRole("button", { name: "Lập biên bản" }).click();
  await expect(
    page.getByLabel("Đội của Nguyễn An", { exact: true }),
  ).toHaveValue("A");
  await expect(page.getByLabel("Đội của Lê Chi", { exact: true })).toHaveValue(
    "B",
  );
  await page.getByLabel("Đội của Nguyễn An", { exact: true }).selectOption("B");
  await expect(
    page.getByText("Đá cho B ở trận này", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lưu biên bản", exact: true }).click();
  await expect(
    page.getByText("Đội cố định A · Đá cho B trận này"),
  ).toBeVisible();
  expect(
    (
      await (
        await request.get(`${API}/users/${players[0].id}`, {
          headers: headers(),
        })
      ).json()
    ).home_team,
  ).toBe("A");
  const next = await createActive();
  await request.post(`${API}/attendance/checkin`, {
    headers: { Authorization: `Bearer ${aToken}` },
    data: { matchId: next.id, lat: 10.78, lng: 106.67 },
  });
  await page.goto(`/matches/${next.id}`);
  await page.getByRole("button", { name: "Lập biên bản" }).click();
  await expect(
    page.getByLabel("Đội của Nguyễn An", { exact: true }),
  ).toHaveValue("A");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Thành viên", exact: true }).click();
  await page
    .getByLabel("Đội cố định của Nguyễn An", { exact: true })
    .selectOption("B");
  await expect(
    page.getByLabel("Đội cố định của Nguyễn An", { exact: true }),
  ).toBeEnabled();
  await expect
    .poll(
      async () =>
        (
          await (
            await request.get(`${API}/users/${players[0].id}`, {
              headers: headers(),
            })
          ).json()
        ).home_team,
    )
    .toBe("B");
  const old = (
    await (
      await request.get(`${API}/matches/${active.id}/report`, {
        headers: headers(),
      })
    ).json()
  ).report;
  expect(old.roster.find((p) => p.userId === players[0].id)).toMatchObject({
    team: "B",
    homeTeam: "A",
  });
});

test("multi-photo blog supports cover, album navigation, retained photos and new uploads", async ({
  page,
  request,
}) => {
  const buffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=",
    "base64",
  );
  const file = (n) => ({
    name: `photo-${n}.png`,
    mimeType: "image/png",
    buffer,
  });
  await signIn(page);
  await page.goto("/blog");
  await page.getByRole("button", { name: "Viết bài mới" }).click();
  await page
    .getByLabel("Tiêu đề", { exact: true })
    .fill("Album một tối cùng đồng đội");
  await page.getByLabel("Mô tả ngắn").fill("Những pha bóng đáng nhớ");
  await page
    .getByLabel("Câu chuyện", { exact: true })
    .fill("Một buổi đá thật vui.");
  await page
    .getByLabel("Thêm ảnh cho bài viết")
    .setInputFiles([file(1), file(2), file(3)]);
  await expect(page.locator(".photo-editor-item")).toHaveCount(3);
  const second = await page
    .locator(".photo-editor-item img")
    .nth(1)
    .getAttribute("src");
  await page.getByRole("button", { name: "Đặt làm ảnh bìa" }).first().click();
  await expect(page.locator(".photo-editor-item img").first()).toHaveAttribute(
    "src",
    second,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Đăng bài viết", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Album một tối cùng đồng đội" }),
  ).toBeVisible();
  albumPost = (
    await (await request.get(`${API}/blog`, { headers: headers() })).json()
  ).find((p) => p.title === "Album một tối cùng đồng đội");
  expect(albumPost.images).toHaveLength(3);
  await page
    .getByRole("button", { name: "Xem album (3 ảnh)", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Ảnh 1 / 3", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Ảnh tiếp theo", exact: true })
    .click();
  await expect(page.getByText("Ảnh 2 / 3", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Ảnh 3 / 3", { exact: true })).toBeVisible();
  const photoDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải hình ảnh", exact: true }).click();
  expect((await photoDownload).suggestedFilename()).toMatch(/\.png$/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Sửa bài viết", exact: true }).click();
  await page.getByRole("button", { name: "Bỏ ảnh 2", exact: true }).click();
  await page.getByLabel("Thêm ảnh cho bài viết").setInputFiles([file(4)]);
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Album một tối cùng đồng đội" }),
  ).toBeVisible();
  const updated = (
    await (await request.get(`${API}/blog`, { headers: headers() })).json()
  ).find((p) => p.id === albumPost.id);
  expect(updated.images).toHaveLength(3);
  expect(updated.images).not.toContain(albumPost.images[1]);
  expect(updated.images[0]).toBe(albumPost.images[0]);
  albumPost = updated;
});

test("light/dark preference persists and key pages remain accessible in both themes", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Chuyển sang nền tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const path of [
    "/",
    "/matches",
    `/matches/${completed.id}`,
    "/players",
    "/funds",
    "/profile/1",
    "/admin",
    "/blog",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).analyze()).violations,
      `${path} dark accessibility`,
    ).toEqual([]);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `${path} mobile dark should fit`,
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    if (["/", "/blog"].includes(path))
      await page.screenshot({
        path: `test-results/${path === "/" ? "home" : "blog"}-dark.png`,
        fullPage: true,
      });
  }
  await page.getByRole("button", { name: "Chuyển sang nền sáng" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/blog-light.png",
    fullPage: true,
  });
});

test("deleting a blog article removes its complete album", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/blog");
  await page.getByRole("button", { name: "Xóa bài viết", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xóa bài viết", exact: true })
    .click();
  await expect(page.locator(".journal-post")).toHaveCount(0);
  for (const url of albumPost.images)
    expect((await request.get(`http://127.0.0.1:3001${url}`)).status()).toBe(
      404,
    );
});

test("player avatars open a viewer separately from upload for admins and members", async ({
  page,
  request,
  browser,
}) => {
  await signIn(page);
  await page.goto(`/profile/${players[0].id}`);
  const previewName = `Xem ảnh đại diện của ${players[0].name}`;
  const preview = page.getByRole("button", { name: previewName, exact: true });
  await expect(
    page.getByRole("heading", { name: players[0].name }),
  ).toBeVisible();
  await expect(preview).toHaveCount(0);
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Đổi ảnh đại diện", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "player-avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(preview).toBeVisible();
  const avatarSrc = await preview.locator("img").getAttribute("src");
  let uploadCount = 0,
    chooserCount = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/avatar")) uploadCount++;
  });
  page.on("filechooser", () => chooserCount++);
  await preview.click();
  const dialog = page.getByRole("dialog", {
    name: `Xem ảnh: Ảnh đại diện của ${players[0].name}`,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".photo-stage img")).toHaveAttribute(
    "src",
    avatarSrc,
  );
  await expect(
    dialog.getByRole("button", { name: "Đóng xem ảnh" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Mở tab mới" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Đóng xem ảnh" }),
  ).toBeFocused();
  const download = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Tải hình ảnh", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("fcdbb-avatar-1.png");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(preview).toBeFocused();
  expect(uploadCount).toBe(0);
  expect(chooserCount).toBe(0);

  await page.goto("/admin");
  await page.getByRole("button", { name: "Thành viên", exact: true }).click();
  await page.getByRole("button", { name: previewName, exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Đóng xem ảnh" }).click();
  await page.goto("/players");
  await page.getByRole("button", { name: previewName, exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("link", {
      name: `Xem hồ sơ của ${players[0].name}`,
      exact: true,
    })
    .click();
  await expect(preview).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Chuyển sang nền tối" }).click();
  await preview.click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/avatar-viewer-mobile.png" });
  await page.keyboard.press("Escape");

  const member = await (
    await request.post(`${API}/auth/login`, {
      data: { username: "test1", password: "test123456" },
    })
  ).json();
  const context = await browser.newContext();
  try {
    await context.addInitScript(({ token, user }) => {
      localStorage.setItem("fcdbb_token", token);
      localStorage.setItem("fcdbb_user", JSON.stringify(user));
    }, member);
    const memberPage = await context.newPage();
    await memberPage.goto(`/profile/${players[0].id}`);
    await expect(
      memberPage.getByRole("heading", { name: players[0].name }),
    ).toBeVisible();
    await expect(
      memberPage.getByRole("button", { name: "Đổi ảnh đại diện", exact: true }),
    ).toHaveCount(0);
    await memberPage
      .getByRole("button", { name: previewName, exact: true })
      .click();
    await expect(memberPage.getByRole("dialog")).toBeVisible();
    await memberPage.keyboard.press("Escape");
    await memberPage.goto(`/profile/${players[1].id}`);
    await expect(
      memberPage.getByRole("button", { name: "Đổi ảnh đại diện", exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }

  await page.route(`**/api/users/${players[0].id}`, async (route) => {
    const response = await route.fetch();
    const user = await response.json();
    await route.fulfill({
      response,
      json: { ...user, avatar: "/missing-avatar-test.png" },
    });
  });
  await page.goto(`/profile/${players[0].id}`);
  await expect(page.locator(".profile-page .club-avatar")).toHaveText("NA");
  await expect(preview).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Đổi ảnh đại diện", exact: true }),
  ).toBeEnabled();
});

test("mobile navigation, compact filters and record cards support complete daily flows", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dock = page.getByRole("navigation", { name: "Thanh điều hướng nhanh" });
  await expect(dock).toBeVisible();
  await page.screenshot({
    path: "test-results/home-active-mobile.png",
    fullPage: true,
  });
  for (const el of await dock.locator("a,button").all()) {
    const box = await el.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  await expect(
    dock.getByRole("link", { name: "Tổng quan", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const more = dock.getByRole("button", { name: "Mở thêm tiện ích" });
  await more.click();
  const sheet = page.getByRole("dialog", { name: "Không gian đội bóng" });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("button", { name: "Đóng điều hướng" }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Shift+Tab");
  await expect(
    sheet.getByRole("button", { name: "Đăng xuất", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    sheet.getByRole("button", { name: "Đóng điều hướng" }),
  ).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/navigation-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  await expect(more).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );

  await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
  await page.getByLabel("Mỗi trang").selectOption("6");
  await expect(page.locator(".match-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.getByLabel("Mỗi trang")).toHaveValue("12");
  await expect(page.locator(".match-card")).toHaveCount(12);
  await dock.getByRole("link", { name: "Trận đấu", exact: true }).click();
  await expect(
    dock.getByRole("link", { name: "Trận đấu", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".standings-mobile")).toBeVisible();
  await expect(page.locator(".standings-mobile .standing-team")).toHaveCount(2);
  await page.screenshot({
    path: "test-results/seasons-mobile.png",
    fullPage: true,
  });

  await dock.getByRole("link", { name: "Quỹ đội", exact: true }).click();
  await expect(page.getByLabel("Số tiền (VNĐ)")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Thêm giao dịch mới", exact: true })
    .click();
  await page.getByLabel("Số tiền (VNĐ)").fill("150000");
  await page
    .getByLabel("Lý do thu chi")
    .fill("Thu quỹ buổi đá kiểm thử giao diện trên điện thoại");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.locator(".fund-records tbody tr")).toHaveCount(1);
  await expect(page.locator(".fund-reason")).toContainText("Thu quỹ buổi đá");
  expect(
    await page
      .locator(".fund-records")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Thêm giao dịch mới", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/funds-mobile.png",
    fullPage: true,
  });

  await more.click();
  await sheet.getByRole("link", { name: "Quản trị", exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.getByLabel("Tên trận", { exact: true })).not.toBeVisible();
  await page
    .getByRole("button", { name: "Thêm lịch trận", exact: true })
    .click();
  await expect(page.getByLabel("Tên trận", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .getByLabel("Tên trận", { exact: true })
    .fill("Buổi đá thêm từ điện thoại");
  await page
    .getByLabel("Tên sân", { exact: true })
    .fill("Sân bóng Thống Nhất — Khu sân 2");
  await page.getByLabel("Vĩ độ", { exact: true }).fill("10.78");
  await page.getByLabel("Kinh độ", { exact: true }).fill("106.67");
  const kickoffLabel = "Bắt đầu trận (giờ Việt Nam)";
  const kickoffMinute = page.getByLabel(`${kickoffLabel} - phút`, { exact: true });
  await page.getByLabel(kickoffLabel, { exact: true }).fill("2026-02-02");
  await page
    .getByLabel(`${kickoffLabel} - giờ`, { exact: true })
    .selectOption("23");
  await kickoffMinute.selectOption("50");
  await expect(page.locator("#match-lock")).toHaveText("00:05:00 03/02/2026");
  await expect(page.locator("#match-end")).toHaveText("01:50:00 03/02/2026");
  await page
    .getByRole("button", { name: "Tạo lịch trận", exact: true })
    .click();
  const createdMatch = page.locator(".admin-fixtures article").filter({
    has: page.getByRole("heading", {
      name: "Buổi đá thêm từ điện thoại",
      exact: true,
    }),
  });
  await expect(createdMatch).toBeVisible();
  await createdMatch
    .getByRole("button", { name: "Sửa lịch", exact: true })
    .click();
  await expect(page.locator("#match-lock")).toHaveText("00:05:00 03/02/2026");
  await kickoffMinute.selectOption("55");
  await expect(page.locator("#match-lock")).toHaveText("00:10:00 03/02/2026");
  await expect(page.locator("#match-end")).toHaveText("01:55:00 03/02/2026");
  await page.getByRole("button", { name: "Lưu lịch trận", exact: true }).click();
  await expect(createdMatch).toContainText("23:55:00 02/02/2026");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Thêm lịch trận", exact: true })
    .click();
  await page.getByRole("button", { name: "Thành viên", exact: true }).click();
  await expect(page.getByLabel("Mật khẩu ban đầu")).not.toBeVisible();
  await page.getByLabel("Tìm thành viên").fill(players[0].name);
  await expect(page.locator(".member-records tbody tr")).toHaveCount(1);
  const existing = (
    await (
      await request.get(`${API}/users/${players[0].id}`, { headers: headers() })
    ).json()
  ).home_team;
  await page
    .getByLabel(`Đội cố định của ${players[0].name}`, { exact: true })
    .selectOption(existing === "A" ? "B" : "A");
  await expect(
    page.getByLabel(`Đội cố định của ${players[0].name}`, { exact: true }),
  ).toBeEnabled();
  expect(
    await page
      .locator(".member-records")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/members-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Chuyển sang nền tối" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/members-mobile-dark.png",
    fullPage: true,
  });
  await page
    .locator(".member-records")
    .getByRole("link", { name: "Hồ sơ", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: players[0].name, exact: true }),
  ).toBeVisible();
  await more.click();
  await sheet.locator(".sheet-member").click();
  await expect(
    page.getByRole("heading", { name: admin.user.name, exact: true }),
  ).toBeVisible();

  await page.goto(`/matches/${completed.id}`);
  await page
    .getByRole("button", { name: "Chỉnh sửa biên bản", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Đi đến phần biên bản" })
    .getByRole("link", { name: "Kết quả", exact: true })
    .click();
  await expect(
    page.getByLabel("Tỉ số đội A", { exact: true }),
  ).toBeInViewport();
  const saveBar = page.locator(".report-save-bar");
  await expect(saveBar).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/report-editor-mobile.png" });
});

test("actual lineup shows this match's attendees; extra players are added explicitly and preserved", async ({
  page,
  request,
}) => {
  const unassigned = await (
    await request.post(`${API}/users`, {
      headers: headers(),
      data: {
        username: "roster-unassigned",
        name: "Phạm Chưa Phân Đội",
        password: "test123456",
      },
    })
  ).json();
  const now = Date.now();
  const match = await (
    await request.post(`${API}/matches`, {
      headers: headers(),
      data: {
        ...past,
        title: "Đội hình theo điểm danh",
        start_time: new Date(now - 600000),
        lock_time: new Date(now + 300000),
        end_time: new Date(now + 3600000),
      },
    })
  ).json();
  for (const username of ["test1", unassigned.username]) {
    const login = await (
      await request.post(`${API}/auth/login`, {
        data: { username, password: "test123456" },
      })
    ).json();
    expect(
      (
        await request.post(`${API}/attendance/checkin`, {
          headers: { Authorization: `Bearer ${login.token}` },
          data: { matchId: match.id, lat: 10.78, lng: 106.67 },
        })
      ).ok(),
    ).toBe(true);
  }
  await signIn(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/matches/${match.id}`);
  await page.getByRole("button", { name: "Lập biên bản", exact: true }).click();
  await expect(page.locator(".editor-player")).toHaveCount(2);
  await expect(
    page.getByLabel("Đội của Trần Bình", { exact: true }),
  ).toHaveValue("A");
  await expect(
    page.getByLabel(`Đội của ${unassigned.name}`, { exact: true }),
  ).toHaveValue("");
  await expect(page.getByLabel("Đội của Võ Dũng", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByLabel("Đội của Nguyễn An", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", {
      name: "Thêm cầu thủ chưa điểm danh",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Tìm cầu thủ để chia đội").fill("Võ Dũng");
  await expect(page.locator(".editor-player")).toHaveCount(0);
  await expect(
    page.getByText("Không tìm thấy cầu thủ trong danh sách trận.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Tìm cầu thủ để chia đội").fill("");
  await page.getByRole("button", { name: "Thêm cầu thủ", exact: true }).click();
  const picker = page.getByRole("region", {
    name: "Thêm cầu thủ chưa điểm danh",
    exact: true,
  });
  await expect(picker).toBeFocused();
  await expect(
    picker.getByRole("heading", {
      name: "Cầu thủ chưa điểm danh",
      exact: true,
    }),
  ).toBeInViewport();
  await expect(
    picker.getByRole("button", {
      name: "Thêm Trần Bình vào đội A",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Tìm cầu thủ chưa điểm danh").fill("Võ Dũng");
  await expect(picker.locator(".extra-player-row")).toHaveCount(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/roster-extra-picker-mobile.png",
  });
  await page.keyboard.press("Escape");
  await expect(picker).toHaveCount(0);
  const add = page.getByRole("button", { name: "Thêm cầu thủ", exact: true });
  await expect(add).toBeFocused();
  await page.getByLabel("Tìm cầu thủ để chia đội").fill("Trần");
  await add.click();
  await page
    .getByRole("button", { name: "Thêm Võ Dũng vào đội A", exact: true })
    .click();
  await expect(picker).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page.locator(".editor-player")).toHaveCount(3);
  await expect(page.getByLabel("Đội của Võ Dũng", { exact: true })).toHaveValue(
    "A",
  );
  await expect(
    page.getByText("Đá cho A ở trận này", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel(`Đội của ${unassigned.name}`, { exact: true })
    .selectOption("B");
  await add.click();
  await expect(
    picker.getByRole("button", { name: "Thêm Võ Dũng vào đội A", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Đóng danh sách bổ sung", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nạp người đã điểm danh", exact: true })
    .click();
  await expect(page.locator(".editor-player")).toHaveCount(3);
  await page.getByRole("button", { name: "Chuyển sang nền tối" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator("#report-roster").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/roster-attendees-mobile-dark.png",
  });
  await page.getByRole("button", { name: "Lưu biên bản", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Chỉnh sửa biên bản", exact: true }),
  ).toBeVisible();
  const saved = await (
    await request.get(`${API}/matches/${match.id}/report`, {
      headers: headers(),
    })
  ).json();
  expect(saved.report.roster).toHaveLength(3);
  expect(
    saved.report.roster.find((p) => p.userId === players[3].id),
  ).toMatchObject({ team: "A", homeTeam: "B" });
  const details = await (
    await request.get(`${API}/matches/${match.id}/details`, {
      headers: headers(),
    })
  ).json();
  expect(details.attendances).toHaveLength(2);
  expect(details.attendances.some((a) => a.user.id === players[3].id)).toBe(
    false,
  );
  expect(
    (
      await (
        await request.get(`${API}/users/${players[3].id}`, {
          headers: headers(),
        })
      ).json()
    ).home_team,
  ).toBe("B");
  await page.reload();
  await page
    .getByRole("button", { name: "Chỉnh sửa biên bản", exact: true })
    .click();
  await expect(page.locator(".editor-player")).toHaveCount(3);
  await expect(page.getByLabel("Đội của Võ Dũng", { exact: true })).toHaveValue(
    "A",
  );
  await expect(picker).toHaveCount(0);
  await page.getByLabel("Đội của Võ Dũng", { exact: true }).selectOption("");
  await expect(page.locator(".editor-player")).toHaveCount(2);
  await page.getByLabel("Đội của Trần Bình", { exact: true }).selectOption("");
  await expect(page.locator(".editor-player")).toHaveCount(2);
  await expect(
    page.getByLabel("Đội của Trần Bình", { exact: true }),
  ).toHaveValue("");
  await add.click();
  await expect(
    picker.getByRole("button", { name: "Thêm Võ Dũng vào đội B", exact: true }),
  ).toBeVisible();
});

test("admin saves score-only results and adds attendance and goals from mobile", async ({
  page,
  request,
  context,
}) => {
  await signIn(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 11, longitude: 107 });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Thành viên", exact: true }).click();
  await page.getByLabel("Số áo của Nguyễn An", { exact: true }).fill("42");
  await page.getByRole("button", { name: "Lưu số áo của Nguyễn An" }).click();
  await expect(page.getByText("Đã lưu số áo.")).toBeVisible();
  await page.goto("/players");
  await expect(
    page
      .locator(".player-card")
      .filter({ hasText: "Nguyễn An" })
      .locator(".jersey-number"),
  ).toHaveText(/42/);

  const result = await request.post(`${API}/matches`, {
    headers: headers(),
    data: { ...past, title: "Trận ghi bổ sung" },
  });
  expect(result.ok()).toBe(true);
  const match = await result.json();
  await page.goto(`/matches/${match.id}`);
  await page.getByRole("button", { name: "Lập biên bản", exact: true }).click();
  await page.getByLabel("Tỉ số đội A").fill("0");
  await page.getByLabel("Tỉ số đội B").fill("0");
  await page.getByRole("button", { name: "Lưu và chốt kết quả" }).click();
  await expect(page.locator(".score-large")).toHaveText("0 : 0");
  await expect(
    page.getByText("Đã chốt kết quả", { exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Điểm danh GPS", exact: true })
    .click();
  await expect(
    page.locator("#match-attendance").getByText(/Cách sân [0-9.]+ m/),
  ).toBeVisible();
  const openAttendance = page.getByRole("button", {
    name: "Bổ sung điểm danh",
    exact: true,
  });
  const attendance = page.getByRole("dialog", { name: "Bổ sung điểm danh" });
  const player = attendance.getByLabel("Cầu thủ cần điểm danh");
  const saveAttendance = attendance.getByRole("button", {
    name: "Lưu điểm danh",
    exact: true,
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await openAttendance.click();
  await expect(attendance).toBeInViewport({ ratio: 1 });
  await expect(player).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(attendance).toBeHidden();
  await expect(openAttendance).toBeFocused();

  await page.setViewportSize({ width: 568, height: 320 });
  await openAttendance.click();
  const minutes = attendance.getByLabel("Giờ cầu thủ đến - phút");
  await expect(saveAttendance).toBeInViewport({ ratio: 1 });
  await minutes.scrollIntoViewIfNeeded();
  await expect(minutes).toBeInViewport({ ratio: 1 });
  await expect(saveAttendance).toBeInViewport({ ratio: 1 });
  await attendance.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(attendance).toBeHidden();

  await page.setViewportSize({ width: 320, height: 568 });
  await openAttendance.click();
  await expect(attendance).toBeInViewport({ ratio: 1 });
  for (const control of [
    player,
    attendance.getByLabel("Giờ cầu thủ đến", { exact: true }),
    attendance.getByLabel("Giờ cầu thủ đến - giờ"),
    minutes,
    attendance.getByLabel("Giờ cầu thủ đến - giây"),
    saveAttendance,
  ]) {
    await expect(control).toBeInViewport({ ratio: 1 });
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(saveAttendance).toBeDisabled();
  await player.selectOption(String(players[0].id));
  await minutes.selectOption("05");
  await saveAttendance.click();
  await expect(attendance).toBeHidden();
  await page.setViewportSize({ width: 375, height: 812 });
  const record = page
    .locator("#match-attendance .person-row")
    .filter({ hasText: "Nguyễn An" });
  await expect(record).toContainText("18:05:00");
  await expect(record).toContainText("Đúng giờ");
  await expect(record).toContainText("Admin bổ sung");

  await page
    .getByRole("button", { name: "Chỉnh sửa biên bản", exact: true })
    .click();
  await page.getByLabel("Tỉ số đội A").fill("14");
  await page.getByLabel("Tỉ số đội B").fill("22");
  await page.getByRole("button", { name: "Thêm cầu thủ", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm Trần Bình vào đội A", exact: true })
    .click();
  await page.getByLabel("Đội của Nguyễn An", { exact: true }).selectOption("A");
  const addGoal = page.getByRole("button", { name: "Thêm bàn", exact: true });
  await addGoal.click();
  const scorer = page.getByLabel("Người ghi bàn", { exact: true });
  await page.getByLabel("Tìm người ghi bàn theo số áo").fill("42");
  await expect(scorer.locator("option")).toHaveCount(2);
  await scorer.selectOption(String(players[0].id));
  await page.getByLabel("Tìm kiến tạo theo tên").fill("tran binh");
  await page
    .getByLabel("Kiến tạo", { exact: true })
    .selectOption(String(players[1].id));
  await page
    .getByRole("button", { name: "Thêm bàn tiếp", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Bàn 1 · Nguyễn An/ }),
  ).toContainText("Trần Bình");
  await expect(scorer).toHaveCount(1);
  await page.getByLabel("Tìm người ghi bàn theo tên").fill("nguyen an");
  await scorer.selectOption(String(players[0].id));
  await page.getByLabel("Lý do chỉnh sửa (bắt buộc)").fill("Bổ sung diễn biến");
  await page.getByRole("button", { name: "Lưu và chốt kết quả" }).click();
  await expect(page.locator(".score-large")).toHaveText("14 : 22");
  await page.reload();
  await expect(page.locator(".score-large")).toHaveText("14 : 22");
  await expect(
    page.getByText("Kiến tạo: Trần Bình", { exact: false }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  );
});
