import assert from "node:assert/strict";
import { GATE_STEPS } from "../src/client/lib/pengajuanBaruData.js";
import { kelompokDariGate } from "../src/client/lib/pengajuanBaruSchema.js";

assert.equal(GATE_STEPS.length, 3);
assert.deepEqual(
  GATE_STEPS.map((g) => g.key),
  ["fetik_p1", "fetik_p1_tdk", "fetik_p1_tdk_tdk"],
);
assert.equal(kelompokDariGate({ c_jenis_subjek: "1", fetik_p1: "Y" }), "5");
assert.equal(kelompokDariGate({ c_jenis_subjek: "1", fetik_p1: "N", fetik_p1_tdk: "Y" }), "7");
assert.equal(
  kelompokDariGate({ c_jenis_subjek: "1", fetik_p1: "N", fetik_p1_tdk: "N", fetik_p1_tdk_tdk: "Y" }),
  "2",
);
assert.equal(
  kelompokDariGate({
    c_jenis_subjek: "1",
    fetik_p1: "N",
    fetik_p1_tdk: "N",
    fetik_p1_tdk_tdk: "N",
    fetik_fokus: "4",
  }),
  "1",
);
assert.equal(kelompokDariGate({ c_jenis_subjek: "2", hwn_hidup_mati: "1" }), "3");
assert.equal(kelompokDariGate({ c_jenis_subjek: "2", hwn_hidup_mati: "2" }), "6");
assert.equal(kelompokDariGate({ c_jenis_subjek: "3" }), "5");
assert.equal(kelompokDariGate({ c_jenis_subjek: "" }), "");
console.log("gate checks OK");
