/**
 * auth — public surface barrel.
 * Pages import components + the server actions from here only; the repository and
 * service stay internal to the feature.
 */
export { LoginForm } from './components/LoginForm.js';
export type { LoginFormProps } from './components/LoginForm.js';
export { SignupForm } from './components/SignupForm.js';
export type { SignupFormProps } from './components/SignupForm.js';
export { GoogleButton } from './components/GoogleButton.js';

export { signupAction, loginAction, googleAction, logoutAction } from './actions.js';
// getCurrentUser is consumed by server components/layouts to resolve the session.
export { getCurrentUser } from './auth.service.js';
