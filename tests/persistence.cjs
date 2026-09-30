const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

// Real browser + the application's expo-sqlite database; no mocked repository.
async function main() {
  const profile = await fs.mkdtemp(
    path.join(os.tmpdir(), "minhas-series-e2e-"),
  );
  const evidence = path.join(__dirname, "../docs/evidencias");
  const baseUrl = process.env.APP_URL || "http://localhost:8081";
  await fs.mkdir(evidence, { recursive: true });
  const errors = [];
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      headless: true,
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      locale: "pt-BR",
    });
  let context;
  let page;
  async function open() {
    context = await launch();
    page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(120000);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseUrl);
    await expect(
      page.getByRole("button", { name: "+ Nova série", exact: true }),
    ).toBeVisible({ timeout: 120000 });
    await expect(page.getByText("Carregando sua coleção…")).toHaveCount(0, {
      timeout: 60000,
    });
  }
  async function create(title, platform, seasons, rating) {
    await page
      .getByRole("button", { name: "+ Nova série", exact: true })
      .click();
    await page.getByLabel(/^Título da série/).fill(title);
    await page.getByLabel("Plataforma", { exact: true }).fill(platform);
    await page
      .getByLabel("Temporadas assistidas", { exact: true })
      .fill(String(seasons));
    if (rating)
      await page
        .getByRole("button", { name: `Nota ${rating}`, exact: true })
        .click();
    await page
      .getByRole("button", { name: "Adicionar à coleção", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Abrir ${title}`, exact: true }),
    ).toBeVisible();
  }
  const card = (title) =>
    page.getByRole("button", { name: `Abrir ${title}`, exact: true });
  try {
    await open();
    await expect(
      page.getByText("Sua próxima maratona começa aqui."),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(evidence, "01-colecao-vazia.png"),
    });
    await page
      .getByRole("button", { name: "+ Nova série", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Adicionar à coleção", exact: true })
      .click();
    await expect(
      page.getByText("Preencha o título e a plataforma."),
    ).toBeVisible();
    await page.getByLabel(/^Título da série/).fill("Validação");
    await page.getByLabel("Plataforma", { exact: true }).fill("Teste");
    for (const invalid of ["", "-1", "1.5", "abc"]) {
      await page
        .getByLabel("Temporadas assistidas", { exact: true })
        .fill(invalid);
      await page
        .getByRole("button", { name: "Adicionar à coleção", exact: true })
        .click();
      await expect(
        page.getByText(
          "Informe um número inteiro de temporadas, a partir de zero.",
        ),
      ).toBeVisible();
    }
    await page.goBack();
    await create("Ruptura", "Apple TV+", 1, 5);
    await create("Dark", "Netflix", 3, 5);
    await create("The Bear", "Disney+", 0, null);
    await expect(card("The Bear")).toContainText("Sem nota");
    await card("Dark").click();
    await page
      .getByRole("button", { name: "✓ Marcar como concluída", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Voltar para assistindo", exact: true }),
    ).toBeVisible();
    await page.goBack();
    await card("Ruptura").click();
    await page
      .getByRole("button", { name: "Editar série", exact: true })
      .click();
    await expect(page.getByLabel(/^Título da série/)).toHaveValue("Ruptura");
    await page.getByLabel("Temporadas assistidas", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Nota 5", exact: true }).click();
    await expect(page.getByText("Sem nota por enquanto.")).toBeVisible();
    await page.getByRole("button", { name: "Nota 4", exact: true }).click();
    await page.screenshot({ path: path.join(evidence, "02-edicao.png") });
    await page
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await expect(page.getByText("02", { exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(evidence, "03-detalhe-atualizado.png"),
    });
    await page.goBack();
    await expect(card("Ruptura")).toContainText("2 temporadas");
    await expect(card("Dark")).toContainText("Concluída");
    await page.screenshot({
      path: path.join(evidence, "04-antes-de-fechar.png"),
    });
    await context.close(); // End the browser process, not just reload the page.
    context = null;
    await open(); // New process using the same on-disk browser profile.
    await expect(card("Ruptura")).toContainText("2 temporadas");
    await expect(card("Ruptura")).toContainText("4/5");
    await expect(card("Dark")).toContainText("Concluída");
    await expect(card("The Bear")).toContainText("Sem nota");
    await expect(page.getByText("3 séries", { exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(evidence, "05-depois-de-reabrir.png"),
    });
    await page.getByRole("button", { name: "Concluídas", exact: true }).click();
    await expect(card("Dark")).toBeVisible();
    await expect(card("Ruptura")).toHaveCount(0);
    await expect(card("The Bear")).toHaveCount(0);
    await page.screenshot({
      path: path.join(evidence, "06-filtro-concluidas.png"),
    });
    await page.getByRole("button", { name: "Assistindo", exact: true }).click();
    await expect(card("Ruptura")).toBeVisible();
    await expect(card("The Bear")).toBeVisible();
    await expect(card("Dark")).toHaveCount(0);
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    await card("Dark").click();
    await page
      .getByRole("button", { name: "Voltar para assistindo", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "✓ Marcar como concluída",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "✓ Marcar como concluída", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Voltar para assistindo", exact: true }),
    ).toBeVisible();
    await page.goBack();
    const quoted = "Série d'água ?; --";
    await create(quoted, "Plataforma ' especial", 0, null);
    await card(quoted).click();
    await page
      .getByRole("button", { name: "Excluir série", exact: true })
      .click();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(
      page.getByText(quoted, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Excluir série", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar exclusão", exact: true })
      .click();
    await expect(page.getByText("3 séries", { exact: true })).toBeVisible();
    await expect(card(quoted)).toHaveCount(0);
    await page.goto(`${baseUrl}/detalhe?id=abc`);
    await expect(
      page.getByText("Identificador de série inválido."),
    ).toBeVisible();
    await page.goto(`${baseUrl}/detalhe?id=999999`);
    await expect(
      page.getByText("Série não encontrada", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    const report = {
      executedAt: new Date().toISOString(),
      platform: `Expo web / ${process.env.PLAYWRIGHT_CHANNEL || "Chromium"} / viewport 390 x 844`,
      browserVersion: context.browser()?.version(),
      persistence:
        "Browser process closed and reopened with the same persistent profile; real expo-sqlite storage.",
      checks: [
        "empty state",
        "required fields",
        "invalid seasons",
        "create 3 series",
        "zero seasons",
        "nullable rating",
        "remove rating",
        "edit and focus refresh",
        "complete and resume",
        "browser restart persistence",
        "all filters after restart",
        "quoted SQL parameters",
        "cancel deletion",
        "confirm deletion",
        "invalid and missing id",
      ],
      pageErrors: errors,
      result: "PASS",
      limitation:
        "This automated test covers web only. Physical Android verification is documented separately in docs/evidencias/android/reinicio.json. iOS runtime was not tested.",
    };
    await fs.writeFile(
      path.join(evidence, "resultado.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    if (page && !page.isClosed()) {
      await page
        .screenshot({ path: path.join(evidence, "falha.png") })
        .catch(() => {});
      console.error((await page.locator("body").innerText()).slice(-16000));
    }
    console.error("Browser errors:", errors);
    throw error;
  } finally {
    if (context) await context.close();
    if (
      path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) ||
      !path.basename(profile).startsWith("minhas-series-e2e-")
    ) {
      throw new Error(
        "Refusing to remove a profile outside the test temporary directory.",
      );
    }
    await fs.rm(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
