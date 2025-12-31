import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from './task.model';

export class UpdateTaskStatus {
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
