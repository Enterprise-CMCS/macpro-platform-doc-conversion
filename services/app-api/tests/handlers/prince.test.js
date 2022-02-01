import { prince } from "../../handlers/prince";
import * as child_process from "child_process";
import * as fs from "fs";

jest.mock("child_process");
jest.mock("fs");

describe("Test prince PDF convertor", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const output = "ABC";
  const encodedInput = "QUJD";
  const execSyncMock = jest
    .spyOn(child_process, "execSync")
    .mockImplementation(() => output);
  const writeFileSyncMock = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation(() => {});

  test("Verify empty event returns error", async () => {
    try {
      const response = await prince({ source: null });
    } catch(e) {
      expect(e instanceof Error).toBe(true);
      expect(e.message).toEqual("No data.");
    }
  });

  test("Verify serverless warmup ejection", async () => {
    const consoleLogMock = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const response = await prince({
      source: "serverless-plugin-warmup",
      body: {},
    });
    expect(response).toBeNull();
    expect(consoleLogMock).toHaveBeenCalledWith("Warmed up!");
  });

  test("Verify text is encoded correctly", async () => {
    const response = await prince({ body: encodedInput });
    expect(writeFileSyncMock).toHaveBeenCalledWith("/tmp/input", output);
  });

  test("Verify execSync is executed correctly", async () => {
    const response = await prince({ body: encodedInput });
    expect(execSyncMock).toHaveBeenCalledWith(
      "/opt/prince /tmp/input -o - --pdf-profile=PDF/UA-1"
    );
    expect(response).toEqual(output);
  });

  test("Verify error is returned if execSync returns something other than a string", async () => {
    execSyncMock.mockImplementation(() => null);
    const consoleMock = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      const response = await prince({ body: encodedInput });
    } catch(e) {
      expect(e instanceof Error).toBe(true);
      expect(e.message).toEqual(
        "TypeError: Cannot read property 'toString' of null"
      );
    }
  });
});
