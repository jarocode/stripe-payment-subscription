import {
    Body,
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Res,
    HttpCode,
    HttpException,
    HttpStatus,
  } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";


@Controller('api/chatbot')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

}
