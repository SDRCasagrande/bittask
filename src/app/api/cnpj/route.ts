import { NextResponse } from "next/server";

// CNPJ lookup using BrasilAPI (free, no auth needed)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cnpj = searchParams.get("cnpj")?.replace(/\D/g, "");

    if (!cnpj || cnpj.length !== 14) {
        return NextResponse.json({ error: "CNPJ invalido" }, { status: 400 });
    }

    // API 1: BrasilAPI
    try {
        const resBrasil = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
            headers: { "Accept": "application/json" },
            next: { revalidate: 86400 }, // cache 24h
        });

        if (resBrasil.ok) {
            const data = await resBrasil.json();
            return NextResponse.json({
                razaoSocial: data.razao_social || "",
                nomeFantasia: data.nome_fantasia || data.razao_social || "",
                cnpj: data.cnpj || cnpj,
                telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : "",
                email: data.email || "",
                endereco: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : "",
                situacao: data.descricao_situacao_cadastral || "",
                abertura: data.data_inicio_atividade || "",
            });
        }
    } catch (error) {
        console.error("BrasilAPI falhou, tentando fallback");
    }

    // API 2: ReceitaWS (Fallback)
    try {
        const resWs = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
            headers: { "Accept": "application/json" }
        });
        if (resWs.ok) {
            const data = await resWs.json();
            if (data.status !== "ERROR") {
                return NextResponse.json({
                    razaoSocial: data.nome || "",
                    nomeFantasia: data.fantasia || data.nome || "",
                    cnpj: cnpj,
                    telefone: data.telefone || "",
                    email: data.email || "",
                    endereco: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : "",
                    situacao: data.situacao || "",
                    abertura: data.abertura || "",
                });
            }
        }
    } catch (e) {
        console.error("ReceitaWS falhou, tentando ultimo recurso");
    }

    // API 3: MinhaReceita (Último Fallback)
    try {
        const resMr = await fetch(`https://minhareceita.org/${cnpj}`, {
            headers: { "Accept": "application/json" }
        });
        if (resMr.ok) {
            const data = await resMr.json();
            return NextResponse.json({
                razaoSocial: data.razao_social || "",
                nomeFantasia: data.nome_fantasia || data.razao_social || "",
                cnpj: cnpj,
                telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : "",
                email: data.email || "",
                endereco: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : "",
                situacao: data.descricao_situacao_cadastral || "",
                abertura: data.data_inicio_atividade || "",
            });
        }
    } catch(e) {
        console.error("MinhaReceita falhou");
    }

    return NextResponse.json({ error: "CNPJ nao encontrado nos provedores publicos. Preencha manualmente ou verifique se foi aberto muito recentemente." }, { status: 404 });
}
