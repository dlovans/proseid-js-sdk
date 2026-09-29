import { shellStyles } from './styles/shell.js';
import { fieldsStyles } from './styles/fields.js';
import { actionsStyles } from './styles/actions.js';
import { experiencesStyles } from './styles/experiences.js';
import { completionStyles } from './styles/completion.js';
import { appearanceStyles } from './styles/appearance.js';
import { responsiveStyles } from './styles/responsive.js';

// Order is intentional: appearance and responsive rules override the base components.
export const styles = shellStyles + fieldsStyles + actionsStyles + experiencesStyles + completionStyles + appearanceStyles + responsiveStyles;
