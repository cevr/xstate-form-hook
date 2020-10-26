import { graphql } from "msw";
import { ApolloError } from "@apollo/client";

export const getHandler = (delay: number = 0) =>
  graphql.mutation("Login", (req, res, ctx) => {
    if (req.variables.shouldError) {
      return res(
        ctx.delay(delay),
        ctx.errors([new ApolloError({ errorMessage: "Something went wrong!" })])
      );
    }

    return res(
      ctx.delay(delay),
      ctx.data({
        login: JSON.stringify(req.variables),
      })
    );
  });
