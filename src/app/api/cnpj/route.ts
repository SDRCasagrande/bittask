import { NextResponse } from "next/server";

// CNPJ lookup using BrasilAPI (free, no auth needed)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj")?.replace(/\D/g, "");

    if (!cnpj || cnpj.length !== 14) {
        return NextResponse.json({ error: "CNPJ invalido" }, { status: 400 });
    }

    try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
            headers: { "Accept": "application/json" },
            next: { revalidate: 86400 }, // cache 24h
        });

        if (!res.ok) {
            return NextResponse.json({ error: "CNPJ nao encontrado" }, { status: 404 });
        }

        const data = await res.json();

        return NextResponse.json({
            razaoSocial: data.razao_social || "",
            nomeFantasia: data.nome_fantasia || "",
            cnpj: data.cnpj || cnpj,
            telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : "",
            email: data.email || "",
            endereco: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : "",
            situacao: data.descricao_situacao_cadastral || "",
            abertura: data.data_inicio_atividade || "",
        });
    } catch (error) {
        console.error("CNPJ lookup error:", error);
        return NextResponse.json({ error: "Erro ao consultar CNPJ" }, { status: 500 });
    }
}
