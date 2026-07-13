"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreModule = void 0;
const common_1 = require("@nestjs/common");
const event_store_consumer_1 = require("./event-store.consumer");
const event_store_controller_1 = require("./event-store.controller");
let EventStoreModule = class EventStoreModule {
};
exports.EventStoreModule = EventStoreModule;
exports.EventStoreModule = EventStoreModule = __decorate([
    (0, common_1.Module)({
        controllers: [event_store_controller_1.EventStoreController],
        providers: [event_store_consumer_1.EventStoreConsumer],
    })
], EventStoreModule);
//# sourceMappingURL=event-store.module.js.map