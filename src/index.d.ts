export type ThemeName = 'light' | 'charcoal' | 'midnight' | 'forest';
export interface FlowColors {
	accent?: string;
	accentInk?: string;
	canvas?: string;
	surface?: string;
	ink?: string;
	copy?: string;
	muted?: string;
	rule?: string;
	success?: string;
	successTint?: string;
	submitInk?: string;
	skeletonGlow?: string;
}
export type FlowType = 'form' | 'guided_assessment' | 'determination' | 'checklist';
export type AppearancePreset = 'soft' | 'capsule' | 'rigid' | 'underline';
export interface Appearance {
	preset?: AppearancePreset;
	shape?: 'soft' | 'capsule' | 'rigid';
	fields?: 'outlined' | 'underline';
	shell?: 'card' | 'flat';
	density?: 'comfortable' | 'compact';
}
export interface Branding {
	/** Safe HTTPS image URL. Falls back to the publisher's ProseID organization logo. */
	logoUrl?: string;
	logoAlt?: string;
	/** Preview/loading preference. A production Flow's saved attribution is authoritative. */
	proseid?: 'full' | 'compact' | 'hidden';
}

export interface SigningAdapter {
	sign(nextAction: Record<string, unknown>, context: { manifest: EmbedManifest; values: Record<string, unknown> }): Promise<unknown>;
}

export interface MountOptions {
	/** Canonical Flow ID shown in the ProseID workspace. */
	flow: string;
	/** Browser-safe `proseid_pk_…` key identifying the organization that owns the Flow. */
	apiKey: string;
	apiBase?: string;
	/** Curated loading/test fallback. A production Flow's saved theme is authoritative. */
	theme?: ThemeName;
	/** Optional palette overrides. Only exact six-digit hex values such as #1a2b3c are accepted. */
	colors?: FlowColors;
	appearance?: AppearancePreset | Appearance;
	branding?: Branding;
	/** CSP nonce applied to the SDK's Shadow DOM style fallback. */
	nonce?: string;
	validateDelay?: number;
	locale?: 'en' | 'sv' | string;
	messages?: Record<string, unknown>;
	submitLabel?: string;
	signingAdapter?: SigningAdapter;
	/** Deprecated compatibility option. Direct rendering does not use an iframe loading policy. */
	loading?: 'eager' | 'lazy';
	/** Deprecated compatibility option. The Flow title comes from its published manifest. */
	title?: string;
	/** Bring the completion and optional receipt-email panel into view. Defaults to true. */
	autoFocusCompletion?: boolean;
	onReady?: (detail: { manifest: EmbedManifest }) => void;
	onChange?: (detail: { name: string; value: unknown; values: Record<string, unknown> }) => void;
	onValidation?: (detail: { valid: boolean; status: string; issues: unknown[] }) => void;
	onSubmit?: (detail: { values: Record<string, unknown> }) => void;
	onSigning?: (detail: { mode: string; signature?: unknown; nextAction?: Record<string, unknown> }) => void;
	onComplete?: (result: CompletionResult) => void;
	onReceipt?: (result: ReceiptResult) => void;
	onLanguage?: (detail: { language: 'en' | 'sv' }) => void;
	onError?: (error: Error) => void;
}

export interface EmbedManifest {
	apiVersion: string;
	flow: { ref: string; flowType: FlowType; title: string; description: string; schemaId: string; schemaVersion: string; effectiveAt: string; language?: 'en' | 'sv'; temporalContext?: { effective_at: string; logic_version: string | null; valid_range: [string | null, string | null] | null } | null; completionBinding?: string };
	publisher: { slug: string; name: string; logo: string | null; verified: boolean };
	schema: {
		title?: string;
		description?: string;
		metadata?: {
			title?: string;
			description?: string;
			language?: 'en' | 'sv';
			jurisdictions?: string[];
			legal_references?: Array<{ instrument?: string; provision?: string; source_url?: string }>;
		};
		definitions: Record<string, Record<string, unknown>>;
	};
	branding: { proseid: { name: string; logo: string; url: string } };
	/** Frozen Flow price. Monetary fields are integer microns: 1,000 microns = US$1. */
	presentation: { theme?: ThemeName; attribution: 'full' | 'compact' | 'hidden'; whiteLabel: boolean; completionMicrons: number; surchargeMicrons: number; testMode?: boolean };
	capabilities: {
		validation: 'remote';
		auditRecord: boolean;
		receiptEmail: boolean;
		testMode?: boolean;
		signing: {
			requested: boolean;
			available: boolean;
			provider: string | null;
			mode: 'none' | 'basic' | 'coming_soon' | string;
		};
	};
}

export interface ReceiptResult {
	status: 'sent' | 'error';
	recordId: string;
	email: string;
	error?: Error;
}

export interface RecordedOutcome {
	fieldId: string;
	label: string;
	type: string;
	value: unknown;
	message?: string;
}

export interface RecordedResult {
	status: string;
	outcomes: RecordedOutcome[];
	notices: Array<{ kind: string; severity: string; message: string }>;
}

export interface CompletionResult {
	ok: true;
	status: 'completed';
	recordId: string;
	effectiveAt: string;
	logicVersion: string | null;
	temporalRange: [string | null, string | null] | null;
	duplicate: boolean;
	delivered: { email: boolean; webhook: boolean };
	nextAction: Record<string, unknown> | null;
	/** Authoritative calculated output returned by the server after the Record is created. */
	result: RecordedResult;
	test?: boolean;
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
export declare const THEME_NAMES: readonly ThemeName[];
export declare const COLOR_TOKEN_NAMES: readonly (keyof FlowColors)[];
export declare function mount(target: string | Element, options: MountOptions): ProseIDForm;
export declare function mountTest(target: string | Element, options: Omit<MountOptions, 'flow'> & { flow?: never }): ProseIDForm;
export declare function mountAll(defaults?: Partial<MountOptions>): ProseIDForm[];
