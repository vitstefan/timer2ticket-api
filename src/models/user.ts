import { ObjectId } from "mongodb";
import { JobDefinition } from "./job_definition";
import { Mapping } from "./mapping/mapping";
import { ServiceDefinition } from "./service_definition/service_definition";

export class User {
  _id!: string | ObjectId;
  username!: string;
  passwordHash!: string;
  registrated!: Date;
  status!: string;
  configSyncJobDefinition!: JobDefinition | null;
  timeEntrySyncJobDefinition!: JobDefinition | null;
  serviceDefinitions!: ServiceDefinition[];
  mappings!: Mapping[];

  static default(username: string, passwordHash: string): User {
    const user = new User();
    user.username = username;
    user.passwordHash = passwordHash;
    user.registrated = new Date();
    user.status = 'registrated';
    user.configSyncJobDefinition = null;
    user.timeEntrySyncJobDefinition = null;
    user.serviceDefinitions = [];
    user.mappings = [];
    return user;
  }
}