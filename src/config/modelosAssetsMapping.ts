import pop1_1Asset from "@/assets/modelos/planilhas pop 1.1 lista de fornecedores.xlsx.asset.json";
import pop1_2Asset from "@/assets/modelos/Recebimento de MP - PL POP 1.2.xls.asset.json";
import pop1_3Asset from "@/assets/modelos/PL pop 1.3 controle de materia prima.xlsx.asset.json";
import pop1_6Asset from "@/assets/modelos/Recebimento de Embalagens - PL POP 1.6.xls.asset.json";
import pop1_7Asset from "@/assets/modelos/Planilha de controle de Lotes internos - PL POP 1.7.xlsx.asset.json";
import pop1_8Asset from "@/assets/modelos/Controle de expurgo - PL POP 1.8.xlsx.asset.json";
import pop2_1Asset from "@/assets/modelos/planilhas_POP 02.1 limpeza diaria.xlsx.asset.json";
import pop2_2Asset from "@/assets/modelos/PL pop 2.2 limpeza semanal.xlsx.asset.json";
import pop2_3Asset from "@/assets/modelos/PL pop 2.3 limpeza mensal.xlsx.asset.json";
import pop2_4Asset from "@/assets/modelos/PL pop 2.4 Veiculo.xlsx.asset.json";
import pop6_1Asset from "@/assets/modelos/cronograma manutencao - PL POP 6.1.xlsx.asset.json";
import pop6_3Asset from "@/assets/modelos/Ordem de Servico Manutencao - PL POP 6.3.xlsx.asset.json";
import pop7_1Asset from "@/assets/modelos/PLANILHA DE MONITORAMENTO DE PRAGAS PL POP 7.1.xlsx.asset.json";
import pop8Asset from "@/assets/modelos/planilhas_POP 08.xlsx.asset.json";
import pop9_1Asset from "@/assets/modelos/Planilhas POP 09.01 ORDEM DIARIA DE PRODUCAO.xlsx.asset.json";
import pop9_4Asset from "@/assets/modelos/Planilhas POP 09.04 RECOLHIMENTO DE PRODUTOS (RECALLL).xlsx.asset.json";

export const MODELOS_ASSETS = {
  "POP-01": [
    { label: "Lista de Fornecedores (1.1)", url: pop1_1Asset.url },
    { label: "Recebimento de MP (1.2)", url: pop1_2Asset.url },
    { label: "Controle de MP (1.3)", url: pop1_3Asset.url },
    { label: "Recebimento Embalagens (1.6)", url: pop1_6Asset.url },
    { label: "Controle de Lotes (1.7)", url: pop1_7Asset.url },
    { label: "Controle de Expurgo (1.8)", url: pop1_8Asset.url }
  ],
  "POP-02": [
    { label: "Limpeza Diária (2.1)", url: pop2_1Asset.url },
    { label: "Limpeza Semanal (2.2)", url: pop2_2Asset.url },
    { label: "Limpeza Mensal (2.3)", url: pop2_3Asset.url },
    { label: "Limpeza de Veículos (2.4)", url: pop2_4Asset.url }
  ],
  "POP-06": [
    { label: "Cronograma Manutenção (6.1)", url: pop6_1Asset.url },
    { label: "Ordem de Serviço (6.3)", url: pop6_3Asset.url }
  ],
  "POP-07": [
    { label: "Monitoramento de Pragas (7.1)", url: pop7_1Asset.url }
  ],
  "POP-08": [
    { label: "Controle de Resíduos", url: pop8Asset.url }
  ],
  "POP-09": [
    { label: "Ordem de Produção (9.1)", url: pop9_1Asset.url },
    { label: "Recolhimento - Recall (9.4)", url: pop9_4Asset.url }
  ]
};
