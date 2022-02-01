import handler from "../../libs/handler-lib";
import * as debugLib from "../../libs/debug-lib";

jest.mock("../../libs/debug-lib");

describe("Test handler-lib", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const debugInit = jest.spyOn(debugLib, "init");
  const debugFlush = jest.spyOn(debugLib, "flush");

  const goodResponse = {
    statusCode: 200,
    body: '"testBody"',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
  const badResponse = {
    ...goodResponse,
    statusCode: 500,
    body: '{"error":"bad response"}',
  };

  const testEvent = {
    body: "testBody",
    pathParameters: "testPathParams",
    queryStringParameters: "testQueryStringParameters",
  };

  const context = { test: "mock" };

  test("Verify configutation with good response", async () => {
    const lambda = async () => testEvent.body;

    const handlerWrapper = await handler(lambda);
    const result = await handlerWrapper(testEvent, context);

    expect(debugInit).toHaveBeenCalledWith(testEvent, context);
    expect(result).toEqual(goodResponse);
  });

  test("Verify configutation with bad response", async () => {
    const e = { message: "bad response" };
    const lambda = async () => {
      throw e;
    };

    const handlerWrapper = await handler(lambda);
    const result = await handlerWrapper(testEvent, context);

    expect(debugInit).toHaveBeenCalledWith(testEvent, context);
    expect(debugFlush).toHaveBeenCalledWith(e);
    expect(result).toEqual(badResponse);
  });
});
