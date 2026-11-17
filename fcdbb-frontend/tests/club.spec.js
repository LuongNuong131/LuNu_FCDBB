import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.describe.configure({ mode: "serial" });
const API = "http://127.0.0.1:3001/api";
let admin, season, editable, completed, players;
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
          data: { username: `test${i}`, name, password: "test123456" },
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
  ).toBeVisible();
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
