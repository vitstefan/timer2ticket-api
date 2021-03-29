import { IsOptional, IsUrl, } from 'class-validator';

export class Config {
  /**
   * below Toggl specific
   */
  workspace?: Workspace | null;
  /**
   * below Redmine specific
   */
  @IsOptional()
  @IsUrl()
  apiPoint?: string | null;

  defaultTimeEntryActivity?: DefaultTimeEntryActivity | null;

  userId?: number;
}

class Workspace {
  id!: string | number;
  name!: string;
}

class DefaultTimeEntryActivity {
  id!: string | number;
  name!: string;
}