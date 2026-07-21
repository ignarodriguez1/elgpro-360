/**
 * Tests de la lógica PURA de compresión de imágenes. El encode real (canvas,
 * createImageBitmap) es glue de navegador y no se testea en Node — acá sólo va
 * lo determinístico: el cálculo de dimensiones y el renombre de archivo.
 *   npx tsx --test src/lib/image-compression.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTargetDimensions, compressedFileName } from "./image-compression";

test("computeTargetDimensions: escala un landscape al lado más largo", () => {
  assert.deepEqual(computeTargetDimensions(4000, 3000, 1920), {
    width: 1920,
    height: 1440,
  });
});

test("computeTargetDimensions: escala un portrait preservando el aspecto", () => {
  assert.deepEqual(computeTargetDimensions(3000, 4000, 1920), {
    width: 1440,
    height: 1920,
  });
});

test("computeTargetDimensions: NUNCA agranda una imagen ya chica", () => {
  assert.deepEqual(computeTargetDimensions(1000, 800, 1920), {
    width: 1000,
    height: 800,
  });
});

test("computeTargetDimensions: deja igual cuando el lado largo es exacto", () => {
  assert.deepEqual(computeTargetDimensions(1920, 1080, 1920), {
    width: 1920,
    height: 1080,
  });
});

test("computeTargetDimensions: cuadrada", () => {
  assert.deepEqual(computeTargetDimensions(5000, 5000, 1920), {
    width: 1920,
    height: 1920,
  });
});

test("computeTargetDimensions: redondea a enteros", () => {
  assert.deepEqual(computeTargetDimensions(4001, 3000, 1920), {
    width: 1920,
    height: 1440,
  });
});

test("compressedFileName: cambia la extensión a la de salida", () => {
  assert.equal(compressedFileName("photo.png", "jpg"), "photo.jpg");
});

test("compressedFileName: normaliza jpeg -> jpg", () => {
  assert.equal(compressedFileName("photo.jpeg", "jpg"), "photo.jpg");
});

test("compressedFileName: agrega extensión si el original no tiene", () => {
  assert.equal(compressedFileName("photo", "jpg"), "photo.jpg");
});

test("compressedFileName: sólo reemplaza la última extensión", () => {
  assert.equal(compressedFileName("my.photo.png", "jpg"), "my.photo.jpg");
});

test("compressedFileName: HEIC de iPhone -> jpg", () => {
  assert.equal(compressedFileName("IMG_1234.HEIC", "jpg"), "IMG_1234.jpg");
});
