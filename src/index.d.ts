export type Theme = Partial<Record<'accent' | 'canvas' | 'surface' | 'ink' | 'copy' | 'muted' | 'rule' | 'success' | 'radius' | 'font', string>>;

export interface SigningAdapter {
	sign(nextAction: Record<string, unknown>, context: { manifest: EmbedManifest; values: Record<string, unknown> }): Promise<unknown>;
}

export interface MountOptions {
	form: `${string}/${string}`;
	/** Browser-safe `proseid_pk_…` key identifying the organization that owns the form. */
	apiKey: string;
	apiBase?: string;
	theme?: Theme;
	nonce?: string;
	validateDelay?: number;
	locale?: 'en' | 'sv' | string;
	messages?: Record<string, string | ((value: string) => string)>;
	submitLabel?: string;
	signingAdapter?: SigningAdapter;
	fetch?: typeof fetch;
	onReady?: (detail: { manifest: EmbedManifest }) => void;
	onChange?: (detail: { name: string; value: unknown; values: Record<string, unknown> }) => void;
	onValidation?: (detail: { valid: boolean; status: string; issues: unknown[] }) => void;
	onSubmit?: (detail: { values: Record<string, unknown> }) => void;
	onComplete?: (result: CompletionResult) => void;
	onError?: (error: Error) => void;
}

export interface EmbedManifest {
	apiVersion: string;
	form: { ref: string; title: string; description: string; schemaId: string; schemaVersion: string };
	publisher: { slug: string; name: string; logo: string | null; verified: boolean };
	schema: { definitions: Record<string, Record<string, unknown>> };
	capabilities: { validation: 'remote'; auditRecord: true; signing: Record<string, unknown> };
}

export interface CompletionResult {
	ok: true;
	status: 'completed';
	sessionId: string;
	duplicate: boolean;
	delivered: { email: boolean; webhook: boolean };
	nextAction: Record<string, unknown> | null;
}

export declare class ProseIDError extends Error { code: string; status: number; details: Record<string, unknown>; }
export declare class ProseIDForm {
	readonly ready: Promise<ProseIDForm>;
	readonly valid: boolean;
	readonly manifest: EmbedManifest;
	validate(): Promise<unknown>;
	destroy(): void;
}
export declare const VERSION: string;
export declare function mount(target: string | Element, options: MountOptions): ProseIDForm;
export declare function mountAll(defaults?: Partial<MountOptions>): ProseIDForm[];
