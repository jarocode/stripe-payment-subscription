import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  //   use(req: any, res: any, next: Function) {
  //     req.rawBody = Buffer.alloc(0);
  //     req.on("data", (chunk: Uint8Array) => {
  //       req.rawBody = Buffer.concat([req.rawBody, chunk]);
  //     });
  //     req.on("end", () => {
  //       try {
  //         // req.body = JSON.parse(req.rawBody.toString());
  //         req.body = req.rawBody;
  //       } catch (error) {
  //         console.log("error:", error);
  //         // Handle parsing error appropriately (e.g., throw a specific exception)
  //         throw new Error(error.message);
  //       } finally {
  //         next();
  //       }
  //     });
  //   }
  use(req: Request, res: Response, next: Function) {
    // Don't call any parsing middleware here
    next();
  }
}
