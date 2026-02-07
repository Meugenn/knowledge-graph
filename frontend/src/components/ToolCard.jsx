import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/fade-in';

function ToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);

  const exampleCall = {
    tool: tool.name,
    arguments: Object.fromEntries(
      Object.entries(tool.inputSchema.properties || {}).slice(0, 3).map(([key, val]) => {
        if (val.type === 'string') return [key, val.enum ? val.enum[0] : `<${key}>` ];
        if (val.type === 'number') return [key, val.enum ? val.enum[0] : 0];
        if (val.type === 'boolean') return [key, true];
        if (val.type === 'array') return [key, []];
        return [key, null];
      })
    ),
  };

  const jsonStr = JSON.stringify(exampleCall, null, 2);

  return (
    <div className="border border-neutral-200 bg-white p-4 mb-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-neutral-400 border border-neutral-200 px-1.5 py-0.5">
            fn
          </span>
          <span className="font-mono text-sm font-medium text-neutral-800">
            {tool.name}
          </span>
        </div>
        <span className="text-neutral-400 text-xs">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>
      <p className="text-neutral-600 font-light leading-relaxed text-sm mt-2">
        {tool.description}
      </p>

      {expanded && (
        <FadeIn>
          <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Parameters
              </span>
              <div className="mt-2 space-y-2">
                {Object.entries(tool.inputSchema.properties || {}).map(([name, prop]) => (
                  <div key={name} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <code className="font-mono text-xs font-semibold text-neutral-800">{name}</code>
                    <Badge variant="outline" className="text-neutral-500">
                      {prop.type}{prop.enum ? ` [${prop.enum.join('|')}]` : ''}
                    </Badge>
                    {(tool.inputSchema.required || []).includes(name) && (
                      <Badge variant="destructive" className="text-[10px]">required</Badge>
                    )}
                    <span className="text-neutral-500 font-light text-xs">{prop.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Returns
              </span>
              <code className="block mt-1 font-mono text-xs text-neutral-600">{tool.returnType}</code>
            </div>

            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Example Call
              </span>
              <pre className="mt-1 bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto">
                <code className="font-mono text-xs text-neutral-700">{jsonStr}</code>
              </pre>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

export default ToolCard;
