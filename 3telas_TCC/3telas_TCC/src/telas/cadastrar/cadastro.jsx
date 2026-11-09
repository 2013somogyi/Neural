import { useState } from 'react'
import './cadastro.css'
import HeaderSite from '../../components/header/headerSite.jsx'

function Cadastro({ aoNavegar }) {
    // Estado para controlar se o menu lateral está aberto ou fechado (retrátil)
    const [menuAberto, setMenuAberto] = useState(false)

    // Lista de Ordens de Serviço (exatamente as que aparecem no seu protótipo!)
    const listaOS = [
        { id: '0001', tipo: 'OS', cliente: 'Ana Clara Mendes', equip: 'Apple iPhone 12', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 691,76' },
        { id: '0002', tipo: 'OS', cliente: 'Roberto Nogueira', equip: 'Apple iPhone 12', status: 'EM EXECUÇÃO', statusClasse: 'execucao', valor: 'R$ 656,93' },
        { id: '0003', tipo: 'Orçamento', cliente: 'Carl Johnson', equip: 'Dell Inspiron 15', status: 'CANCELADA', statusClasse: 'cancelada', valor: 'R$ 652,90' },
        { id: '0004', tipo: 'OS', cliente: 'Lara Croft', equip: 'HP DeskJet 2774', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 99,81' },
        { id: '0005', tipo: 'OS', cliente: 'Roberto Nogueira', equip: 'Montado Gamer Ryzen 5', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 204,42' },
        { id: '0006', tipo: 'OS', cliente: 'Lara Croft', equip: 'Lenovo IdeaPad 3', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 284,38' },
        { id: '0007', tipo: 'OS', cliente: 'Ana Clara Mendes', equip: 'Apple iPad 9', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 211,83' },
        { id: '0008', tipo: 'Orçamento', cliente: 'Lara Croft', equip: 'Apple iPad 9', status: 'AGUARDANDO PEÇA', statusClasse: 'aguardando', valor: 'R$ 359,61' },
        { id: '0009', tipo: 'OS', cliente: 'Lara Croft', equip: 'Dell Inspiron 15', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 200,21' },
        { id: '00010', tipo: 'OS', cliente: 'Maria Souza Lima', equip: 'HP DeskJet 2774', status: 'ABERTA', statusClasse: 'aberta', valor: 'R$ 0,00' },
        { id: '00011', tipo: 'OS', cliente: 'Carl Johnson', equip: 'Montado Gamer Ryzen 5', status: 'CONCLUÍDA', statusClasse: 'concluida', valor: 'R$ 529,20' }
    ]

    return (
        <div className="painelPai">
            <HeaderSite
                aoNavegar={aoNavegar}
                menuAberto={menuAberto}
                setMenuAberto={setMenuAberto}
            />

            {/* 2. CORPO: SIDEBAR RETRÁTIL + CONTEÚDO */}
            <div className="painelCorpo">

                {/* Fundo escurecido suave (Backdrop): quando você clica fora da barra, ela retrai! */}
                {menuAberto && (
                    <div 
                        className="sidebarBackdrop" 
                        onClick={() => setMenuAberto(false)}
                    />
                )}

                {/* Menu Lateral Esquerdo Retrátil */}
                <aside className={`painelSidebar ${menuAberto ? 'aberto' : ''}`}>
                    <button className="sidebarItem">👥 Cliente</button>
                    <button className="sidebarItem ativo">🛠 Ordem de Serviço</button>
                    <button className="sidebarItem">📦 Estoque & Peças</button>
                    <button className="sidebarItem">🚚 Fornecedor</button>
                    <button className="sidebarItem">📈 Relatório</button>
                    <button className="sidebarItem">👤 Técnicos / Equipe</button>
                </aside>

                {/* Conteúdo Principal com a Tabela */}
                <main className="painelConteudo">

                    {/* Barra de Filtros e Nova OS */}
                    <div className="barraOS">
                        <div className="tituloArea">
                            <h2 className="tituloOS">ORDEM DE SERVIÇO (O.S)</h2>
                            <button className="btnNovaOS">+ Nova O.S.</button>
                        </div>

                        <div className="filtroArea">
                            <select defaultValue="">
                                <option value="">Todos os Status</option>
                                <option value="Aberta">Aberta</option>
                                <option value="Em Execucao">Em Execução</option>
                                <option value="Concluida">Concluída</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>

                            <input type="text" placeholder="Buscar por Cliente ou Equip..." />
                            <button className="btnPesquisar">🔍</button>
                        </div>
                    </div>

                    {/* Tabela de Ordens de Serviço */}
                    <div className="tabelaCard">
                        <table className="tabelaOS">
                            <thead>
                                <tr>
                                    <th>Nº OS</th>
                                    <th>TIPO</th>
                                    <th>CLIENTE</th>
                                    <th>EQUIPAMENTO</th>
                                    <th>STATUS</th>
                                    <th>VALOR LÍQUIDO</th>
                                    <th>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* O .map() percorre a lista e cria cada linha da tabela automaticamente! */}
                                {listaOS.map((os) => (
                                    <tr key={os.id}>
                                        <td>{os.id}</td>
                                        <td>{os.tipo}</td>
                                        <td><strong>{os.cliente}</strong></td>
                                        <td>{os.equip}</td>
                                        <td>
                                            <span className={`badge ${os.statusClasse}`}>
                                                {os.status}
                                            </span>
                                        </td>
                                        <td><strong>{os.valor}</strong></td>
                                        <td>
                                            <button className="btnAcao">Abrir / Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </main>
            </div>

        </div>
    )
}

export default Cadastro
