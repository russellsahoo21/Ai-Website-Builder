import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React, { useState } from 'react';
import SandboxIframe from '../../src/sandbox/SandboxIframe.jsx';

describe('SandboxIframe Component Behavior', () => {
  it('Invalid files do not create an onError render loop when parent updates state', () => {
    let renderCount = 0;
    let errorCount = 0;

    function TestHost() {
      renderCount++;
      const [error, setError] = useState(null);
      const invalidFiles = {
        'src/App.jsx': 'export default function App() { return <div>Unclosed tag; }'
      };

      return (
        <SandboxIframe
          files={invalidFiles}
          onError={(err) => {
            errorCount++;
            setError(err);
          }}
        />
      );
    }

    render(<TestHost />);

    // Even if setError triggers a host re-render, errorCount must not loop infinitely
    expect(renderCount).toBeLessThan(10);
    expect(errorCount).toBe(1);
  });

  it('Stale SANDBOX_MOUNT_SUCCESS messages from untracked windows are ignored', () => {
    const validFiles = {
      'src/App.jsx': 'import React from \"react\"; export default function App() { return <h1>Safe</h1>; }'
    };
    const { container } = render(<SandboxIframe files={validFiles} />);
    const iframes = container.querySelectorAll('iframe');

    // Dispatch message with foreign/stale event.source (window !== iframe.contentWindow)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_MOUNT_SUCCESS' },
          source: window
        })
      );
    });

    // Staging slot should NOT be promoted by stale message
    expect(iframes[1].className).toContain('opacity-0');
  });

  it('Stale SANDBOX_RUNTIME_ERROR messages from untracked windows are ignored', () => {
    const onError = vi.fn();
    const validFiles = {
      'src/App.jsx': 'import React from \"react\"; export default function App() { return <h1>Safe</h1>; }'
    };
    render(<SandboxIframe files={validFiles} onError={onError} />);

    // Dispatch runtime error from foreign/stale source
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_RUNTIME_ERROR', error: { message: 'stale error' } },
          source: window
        })
      );
    });

    // onError must not be called for stale message
    expect(onError).not.toHaveBeenCalled();
  });

  it('Repaired code replaces the preview only after matching window emits SANDBOX_MOUNT_SUCCESS', () => {
    const validFiles1 = {
      'src/App.jsx': 'export default function App() { return <div>Version 1</div>; }'
    };
    const validFiles2 = {
      'src/App.jsx': 'export default function App() { return <div>Version 2 Repaired</div>; }'
    };

    const { container, rerender } = render(<SandboxIframe files={validFiles1} />);
    const iframes = container.querySelectorAll('iframe');

    // Mount slot A
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_MOUNT_SUCCESS' },
          source: iframes[0].contentWindow
        })
      );
    });
    expect(iframes[0].className).toContain('opacity-100');

    // Supply repaired files (staged in slot B)
    rerender(<SandboxIframe files={validFiles2} />);
    // Slot A must remain visible before mount success
    expect(iframes[0].className).toContain('opacity-100');
    expect(iframes[1].className).toContain('opacity-0');

    // Mount success from slot B
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_MOUNT_SUCCESS' },
          source: iframes[1].contentWindow
        })
      );
    });

    // Now slot B is promoted to visible
    expect(iframes[1].className).toContain('opacity-100');
  });

  it('Previous working preview remains visible during staging failure and repair', () => {
    const workingFiles = {
      'src/App.jsx': 'export default function App() { return <div>Working V1</div>; }'
    };
    const brokenFiles = {
      'src/App.jsx': 'export default function App() { return <div>Broken Runtime</div>; }'
    };
    const onError = vi.fn();

    const { container, rerender } = render(<SandboxIframe files={workingFiles} onError={onError} />);
    const iframes = container.querySelectorAll('iframe');

    // Successfully mount V1
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_MOUNT_SUCCESS' },
          source: iframes[0].contentWindow
        })
      );
    });

    // Send broken files
    rerender(<SandboxIframe files={brokenFiles} onError={onError} />);

    // Slot B fails with runtime error
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SANDBOX_RUNTIME_ERROR', error: {message: 'Runtime crash in B' } },
          source: iframes[1].contentWindow
        })
      );
    });

    // Slot A remains 100% online and visible
    expect(iframes[0].className).toContain('opacity-100');
    // Failed staging slot B is blanked/hidden
    expect(iframes[1].className).toContain('opacity-0');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Runtime crash in B' }));
  });
});
