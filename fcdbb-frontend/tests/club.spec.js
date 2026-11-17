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
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("admin records both teams, goal, result and audit; exports CSV and updates standings", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/matches/${editable.id}`);
  await page.getByRole("button", { name: "Lập biên bản" }).click();
  await page.getByLabel("Đội của Nguyễn An").selectOption("A");
  await page.getByLabel("Đội của Trần Bình").selectOption("B");
  await page
    .getByLabel("Mùa giải", { exact: true })
    .selectOption(String(season.id));
  await page.getByRole("button", { name: "Thêm bàn", exact: true }).click();
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

test("375, 768, 1024 and 1440px layouts fit the viewport and mobile navigation works", async ({
  page,
}) => {
  await signIn(page);
  for (const width of [375, 768, 1024, 1440]) {
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
  await expect(page.locator(".club-avatar")).toHaveText("NA");
  await expect(preview).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Đổi ảnh đại diện", exact: true }),
  ).toBeEnabled();
});
