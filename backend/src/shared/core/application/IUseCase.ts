import { ResultAsync } from 'neverthrow';
import { BusinessException } from '../exceptions/BusinessException';

export interface IUseCase<IRequest, IResponse> {
  /**
   * Phương thức duy nhất chạy luồng nghiệp vụ.
   * Tất cả lỗi nghiệp vụ được chặn lại trong ResultAsync thay vì throw Error gây sập.
   */
  execute(
    request?: IRequest,
  ): ResultAsync<IResponse, BusinessException | Error>;
}
