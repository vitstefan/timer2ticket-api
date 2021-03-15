import { IsOptional, IsUrl, } from 'class-validator';

export class Config {
  /**
   * below Toggl specific
   */
  workspaceId?: string | number | null;
  /**
   * below Redmine specific
   */
  @IsOptional()
  @IsUrl()
  apiPoint?: string | null;

  defaultTimeEntryActivityId?: number | null;

  userId?: number;
}