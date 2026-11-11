import './footer.css'

function Footer({aoNavegar}) {
    return (
        <footer className="footer">
            <a className="footer-escrita" href="#inicio" aria-label="N Neural, voltar ao início">
                <span className="footer-logo" aria-hidden="true">N</span>
                <span>N Neural</span>

            </a>
            <p>Gestão simples para uma assistência em movimento.</p>
            <span>© N Neural</span>
        </footer>
    );
}

export default Footer;