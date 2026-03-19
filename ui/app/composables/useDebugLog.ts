/**
 * Conversation debug logger.
 * Stores raw events for inspection/export and provides styled console helpers.
 */
import { reactive } from 'vue';

const entries: Record<string, unknown>[] = reactive([]);

const session = reactive({ userId: null as string | null, sessionId: null as string | null });

const BADGE = 'padding:2px 8px;border-radius:3px;font-weight:500;text-shadow:0 1px 1px rgba(0,0,0,.2);';

type LogFn = (label: string, ...args: unknown[]) => void;

function styled(method: 'log' | 'warn' | 'error', bg: string): LogFn {
    const css = `background:linear-gradient(135deg,${bg});color:#fff;${BADGE}`;
    return (label, ...args) => console[method](`%c${label}`, css, ...args);
}

export const log = {
    info: styled('log', '#4a9eff,#357abd'),
    success: styled('log', '#7de37d,#27ae60'),
    warn: styled('warn', '#ffa502,#e67e22'),
    error: styled('error', '#ff4757,#c0392b'),
    conversation: styled('log', '#8e44ad,#6c3483'),
};

export function useDebugLog() {
    function setSession(userId: string | null, sessionId: string | null) {
        session.userId = userId;
        session.sessionId = sessionId;
        log.info('SESSION', `userId: ${userId}`, `sessionId: ${sessionId}`);
    }

    function record(entry: Record<string, unknown>) {
        entries.push({ ...entry });
        const label = entry.author === 'user' ? '▶ USER' : '◀ AGENT';
        log.conversation(label, entry);
    }

    function getPayload() {
        return JSON.parse(JSON.stringify({ userId: session.userId, sessionId: session.sessionId, entries }));
    }

    async function copyToClipboard(): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(JSON.stringify(getPayload(), null, 2));
            return true;
        } catch {
            return false;
        }
    }

    function logToConsole() {
        log.info('LOG', getPayload());
    }

    return { session, setSession, record, copyToClipboard, logToConsole };
}
