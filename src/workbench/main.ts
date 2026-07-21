import { Workbench } from './Workbench';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

const workbench = new Workbench(root);
workbench.mount();
