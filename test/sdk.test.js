import { beforeEach, describe } from 'vitest';
import { renderingTests } from './cases/rendering.js';
import { transportTests } from './cases/transport.js';
import { navigationTests } from './cases/navigation.js';
import { guidedValidationTests } from './cases/guided-validation.js';
import { fieldsTests } from './cases/fields.js';
import { languageTests } from './cases/language.js';
import { appearanceTests } from './cases/appearance.js';
import { testModeTests } from './cases/test-mode.js';
import { completionTests } from './cases/completion.js';
import { guidedCompletionTests } from './cases/guided-completion.js';
import { recordedExperiencesTests } from './cases/recorded-experiences.js';

beforeEach(() => {
	document.body.innerHTML = '<div id="form"></div>';
	localStorage.clear();
});

// Keep registration order and the shared reset identical across the focused case modules.
describe('ProseID SDK', () => {
	renderingTests();
	transportTests();
	navigationTests();
	guidedValidationTests();
	fieldsTests();
	languageTests();
	appearanceTests();
	testModeTests();
	completionTests();
	guidedCompletionTests();
	recordedExperiencesTests();
});
