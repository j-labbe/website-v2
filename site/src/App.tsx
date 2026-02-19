import type { PipelineMeta } from '@jacklabbe/shared';

// Cross-package type import proves workspace resolution works
const _typeCheck: PipelineMeta | null = null;
void _typeCheck;

export default function App() {
  return (
    <div>
      <h1>jacklabbe.com</h1>
    </div>
  );
}
