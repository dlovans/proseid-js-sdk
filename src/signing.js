import { ProseIDError } from './errors.js';

/**
 * Future signing boundary. Completion responses may eventually carry `nextAction: { type: 'sign',
 * provider, ... }`. The form delegates that action to an injected adapter rather than coupling the
 * renderer to UIP or any other provider.
 */
export class SigningCoordinator {
	constructor(adapter = null) {
		this.adapter = adapter;
	}

	async handle(nextAction, context) {
		if (!nextAction) return null;
		if (nextAction.type !== 'sign' || typeof this.adapter?.sign !== 'function') {
			throw new ProseIDError('signing_adapter_required', 'This form requires a signing method that is not available here.');
		}
		return this.adapter.sign(nextAction, context);
	}
}

