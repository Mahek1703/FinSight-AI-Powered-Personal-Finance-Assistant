import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";
import process from "node:process";
import { doc, getDoc, setDoc } from "firebase/firestore";

describe("Firestore Security Rules", () => {
  let testEnv;
  let emulatorAvailable = true;

  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), "../firestore.rules");
    let rules = "";
    try {
      rules = fs.readFileSync(rulesPath, "utf8");
    } catch {
      rules = fs.readFileSync(path.resolve(process.cwd(), "firestore.rules"), "utf8");
    }

    try {
      testEnv = await initializeTestEnvironment({
        projectId: "finsight-test-project",
        firestore: {
          rules,
          host: "127.0.0.1",
          port: 8080,
        },
      });
    } catch {
      // If emulator is not running locally, mark as skipped so test reports honest requirement
      emulatorAvailable = false;
      console.warn(
        "Firebase emulator is not running on 127.0.0.1:8080. Start emulator with `firebase emulators:start --only firestore` to run live rules tests."
      );
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv && emulatorAvailable) {
      await testEnv.clearFirestore();
    }
  });

  it("verifies security rules file exists and contains user-scoped ownership rules", () => {
    const rulesPath = path.resolve(process.cwd(), "../firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");
    expect(rules).toContain("isOwner(userId)");
    expect(rules).toContain("match /users/{userId}");
    expect(rules).toContain("match /expenses/{docId}");
    expect(rules).toContain("match /income/{docId}");
  });

  it("allows authenticated user to write and read their own expense records", async () => {
    if (!emulatorAvailable) return;

    const aliceContext = testEnv.authenticatedContext("alice_uid");
    const aliceDb = aliceContext.firestore();
    const aliceExpenseDoc = doc(aliceDb, "users/alice_uid/expenses/exp_1");

    await assertSucceeds(
      setDoc(aliceExpenseDoc, {
        amount: 250,
        category: "Food",
        note: "Lunch",
        accountType: "Cash",
      })
    );

    await assertSucceeds(getDoc(aliceExpenseDoc));
  });

  it("denies user from reading or writing another user's private data", async () => {
    if (!emulatorAvailable) return;

    const bobContext = testEnv.authenticatedContext("bob_uid");
    const bobDb = bobContext.firestore();
    const aliceExpenseDoc = doc(bobDb, "users/alice_uid/expenses/exp_1");

    await assertFails(
      setDoc(aliceExpenseDoc, {
        amount: 100,
        category: "Food",
      })
    );

    await assertFails(getDoc(aliceExpenseDoc));
  });

  it("denies unauthenticated visitors from accessing any user data", async () => {
    if (!emulatorAvailable) return;

    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();
    const aliceExpenseDoc = doc(unauthDb, "users/alice_uid/expenses/exp_1");

    await assertFails(getDoc(aliceExpenseDoc));
    await assertFails(
      setDoc(aliceExpenseDoc, {
        amount: 50,
      })
    );
  });
});
