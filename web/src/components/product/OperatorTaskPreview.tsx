import {Check,Info,ShieldCheck} from 'lucide-react';
import {accountMoney} from '@/lib/account-format';
import type {operatorPreflight,DraftIssue} from '@/lib/operator-preflight';
const issueText:Record<DraftIssue,[string,string]>={
 GOAL:['Describe what you need (at least 3 characters).','Опишите, что ищете: минимум 3 символа.'],
 BUDGET:['Enter a positive task cap with up to 6 decimal places.','Укажите положительный лимит: до 6 знаков после точки.'],
 RESERVE:['Enter a non-negative reserve with up to 6 decimal places.','Укажите неотрицательный резерв: до 6 знаков после точки.'],
 REGION:['Choose a region code or ANY (up to 20 characters).','Укажите код региона или ANY: до 20 символов.'],
 QUANTITY:['Choose a whole quantity from 1 to 10.','Укажите целое количество от 1 до 10.'],
 CAP_TOO_LOW:['The test total exceeds your task cap. Increase the cap or reduce quantity.','Тестовая сумма превышает лимит. Увеличьте лимит или уменьшите количество.'],
};
export function OperatorTaskPreview({draft,ru,region,delegated,consent,wallet,readOnly,configured,planning,busy}:{draft:ReturnType<typeof operatorPreflight>;ru:boolean;region:string;delegated:boolean;consent:boolean;wallet:string|null;readOnly:boolean;configured:boolean|null;planning:boolean;busy:boolean}){
 const reason = readOnly?(ru?'Сервис в режиме просмотра. Запуск недоступен.':'The service is read-only. Running tasks is unavailable.')
 :planning?(ru?'Текущая задача уже выполняется.':'Your current task is already running.')
 :busy?(ru?'Ожидаем ответ сервера. Не создавайте повторную задачу.':'Waiting for the server. Do not create a second task.')
 :draft.issues.length?issueText[draft.issues[0]][ru?1:0]
 :!wallet?(ru?'Черновик готов. Войдите кошельком, чтобы запустить агента.':'Draft ready. Sign in with your wallet to run the agent.')
 :configured===false?(ru?'Модель недоступна. Запуск остановлен.':'The model is unavailable. Running is blocked.')
 :delegated&&!consent?(ru?'Нужно отдельное разрешение на одну тестовую покупку.':'Separate consent is required for one test purchase.')
 :delegated?(ru?'Можно запустить в пределах явного разрешения.':'Ready to run within your explicit permission.')
 :(ru?'Можно подготовить котировку. Списание потребует отдельного подтверждения.':'Ready to prepare a quote. A debit requires separate confirmation.');
 return <section className="op-task-preview" aria-label={ru?'Сводка задачи':'Task preview'}><div className="op-preview-title"><ShieldCheck size={17}/><strong>{ru?'Ваши условия':'Your boundaries'}</strong><span>{ru?'Только Testnet':'Testnet only'}</span></div><dl><div><dt>{ru?'Тестовая сумма':'Test total'}</dt><dd>{draft.testAmountUnits?accountMoney(draft.testAmountUnits):'—'} <small>test USDC</small></dd></div><div><dt>{ru?'Лимит списания':'Spend cap'}</dt><dd>{draft.budgetUnits?accountMoney(draft.budgetUnits):'—'} <small>test USDC</small></dd></div><div><dt>{ru?'Минимальный остаток':'Keep in account'}</dt><dd>{draft.reserveUnits?accountMoney(draft.reserveUnits):'—'} <small>test USDC</small></dd></div><div><dt>{ru?'Регион':'Region'}</dt><dd>{region.trim().toUpperCase()||'—'}</dd></div><div><dt>{ru?'Исполнение':'Execution'}</dt><dd>{delegated?(ru?'По разрешению':'With permission'):(ru?'Сначала котировка':'Quote first')}</dd></div></dl><p id="operator-readiness" role="status" aria-atomic="true">{draft.valid?<Check size={15}/>:<Info size={15}/>}<span>{reason}</span></p><small className="op-preview-disclaimer">{ru?'Локальный расчёт: 1 test USDC за единицу. Сервер проверит наличие, средства и сохранённые лимиты. Это не котировка и не разрешение на оплату.':'Local estimate: 1 test USDC per unit. The server still checks availability, funds and saved limits. This is not a quote or payment permission.'}</small></section>;
}
