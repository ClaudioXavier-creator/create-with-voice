
import React from "react";

interface PrintableTemplateProps {
  id: string;
  title: string;
  subtitle?: string;
  data: (string | number | boolean | null)[][];
  headerInfo?: { label: string; value: string }[];
}

export const PrintableTemplate: React.FC<PrintableTemplateProps> = ({
  id,
  title,
  subtitle,
  data,
  headerInfo
}) => {
  return (
    <div id={id} className="p-4 sm:p-8 bg-white text-black min-h-[297mm] w-full max-w-[210mm] mx-auto shadow-sm print:shadow-none print:p-0">
      {/* Cabeçalho Oficial */}
      <div className="border-2 border-black mb-6">
        <div className="flex border-b-2 border-black">
          <div className="w-1/4 p-4 flex items-center justify-center border-r-2 border-black font-bold text-center italic">
            [LOGO DA EMPRESA]
          </div>
          <div className="w-2/4 p-4 flex flex-col items-center justify-center border-r-2 border-black text-center">
            <h1 className="text-xl font-bold uppercase">{title}</h1>
            {subtitle && <p className="text-xs mt-1 uppercase font-semibold text-gray-600">{subtitle}</p>}
          </div>
          <div className="w-1/4 p-2 text-[10px] flex flex-col justify-between">
            <p><strong>CÓDIGO:</strong> MOD-BPF-01</p>
            <p><strong>REVISÃO:</strong> 00</p>
            <p><strong>DATA:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>PÁGINA:</strong> 1 de 1</p>
          </div>
        </div>

        {headerInfo && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-sm bg-gray-50/50">
            {headerInfo.map((info, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap uppercase text-xs">{info.label}:</span>
                <span className="border-b border-dotted border-black flex-1 min-h-[1.2rem]">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-black text-[11px]">
          <thead>
            <tr className="bg-gray-200">
              {data[0]?.map((cell, idx) => (
                <th key={idx} className="border border-black p-2 text-center font-bold uppercase tracking-wider">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.length > 1 ? data.slice(1) : Array.from({ length: 15 }).map(() => Array(data[0]?.length).fill(""))).map((row, rowIdx) => (
              <tr key={rowIdx} className="h-8">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-black p-1 text-center">
                    {cell === "☐" || cell === "☐C ☐NC" || cell === "☐S ☐N" || cell === "☐A ☐R" || cell === "☐Aus ☐Pres" ? (
                      <div className="w-4 h-4 border border-black inline-block mx-auto align-middle"></div>
                    ) : (
                      <span className="break-words">{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé de Assinaturas */}
      <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs">
        <div className="space-y-1">
          <div className="border-t border-black pt-2 mx-4">
            <p className="font-bold">RESPONSÁVEL TÉCNICO</p>
            <p className="text-[10px] text-gray-500 italic">CARIMBO E ASSINATURA</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="border-t border-black pt-2 mx-4">
            <p className="font-bold">CONTROLE DE QUALIDADE</p>
            <p className="text-[10px] text-gray-500 italic">ASSINATURA / DATA</p>
          </div>
        </div>
      </div>

      {/* Notas de Rodapé */}
      <div className="mt-6 text-[9px] text-gray-500 flex justify-between border-t border-gray-200 pt-2 italic">
        <p>Documento controlado pelo Sistema de Gestão BPF Digital.</p>
        <p>Proibida reprodução parcial ou total sem autorização.</p>
      </div>
    </div>
  );
};

