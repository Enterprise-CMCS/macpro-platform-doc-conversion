import * as debugLib from "../../libs/debug-lib";

describe("Test debug-lib", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  test("Verify init configuration", async () => {
    const testEvent = {
      body: "testBody",
      pathParameters: "testPathParams",
      queryStringParameters: "testQueryStringParameters",
    };

    const debugSpy = jest.spyOn(debugLib, "debug");
    debugLib.init(testEvent);

    expect(debugSpy).toHaveBeenCalledWith("API event", testEvent);
  });

  test("Verify flush can be called", async () => {
    const flushSpy = jest.spyOn(debugLib, "flush");
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleDebugMock = jest
      .spyOn(console, "debug")
      .mockImplementation(() => {});
    debugLib.flush("test");

    expect(flushSpy).toHaveBeenCalledWith("test");
    expect(consoleErrorMock).toHaveBeenCalledWith("test");
  });
});
