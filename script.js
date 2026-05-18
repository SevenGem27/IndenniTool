const motiviAree = [
    { value: 'dimissioni', text: 'Dimissioni (Art. 86 lett. e)' },
    { value: 'art86a', text: 'Superamento comporto / Invalidità (Art. 86 lett. a)' },
    { value: 'art86b', text: 'Requisiti pensionistici senza prosecuzione (Art. 86 lett. b)' },
    { value: 'art86c', text: 'Giustificato motivo (Art. 86 lett. c)' },
    { value: 'art86d', text: 'Licenziamento per giusta causa (Art. 86 lett. d)' },
    { value: 'art86f', text: 'Dimissioni per giusta causa (Art. 86 lett. f)' },
    { value: 'art86g', text: 'Morte (Art. 86 lett. g)' }
];

const motiviDirigenti = [
    { value: 'dimissioni_dir', text: 'Dimissioni del dirigente (Art. 26 c. 2)' },
    { value: 'impresa_dir', text: 'Risoluzione ad iniziativa dell\'impresa non per giusta causa (Art. 26 c. 1)' },
    { value: 'ingiustificato_dir', text: 'Licenziamento riconosciuto ingiustificato dal Collegio (Art. 28 c. 15)' },
    { value: 'morte_dir', text: 'Morte del dirigente (Art. 26 c. 5)' }
];

window.onload = function() {
    document.getElementById('categoria').addEventListener('change', onCategoriaChange);
    document.getElementById('motivo').addEventListener('change', onMotivoChange);
    onCategoriaChange();
};

function onCategoriaChange() {
    const categoria = document.getElementById('categoria').value;
    const motivoSelect = document.getElementById('motivo');
    const oldVal = motivoSelect.value;

    motivoSelect.innerHTML = '';
    const opzioni = categoria === 'dirigenti' ? motiviDirigenti : motiviAree;
    opzioni.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        motivoSelect.appendChild(option);
    });

    if (opzioni.some(o => o.value === oldVal)) {
        motivoSelect.value = oldVal;
    }

    const previdenzaSelect = document.getElementById('previdenza');
    const optInferiore = document.getElementById('opt-inferiore');
    
    if (categoria === 'dirigenti') {
        if(optInferiore) optInferiore.style.display = 'none';
        if(previdenzaSelect.value === 'inferiore') previdenzaSelect.value = 'assente';
    } else {
        if(optInferiore) optInferiore.style.display = 'block';
    }

    onMotivoChange();
}

function onMotivoChange() {
    const categoria = document.getElementById('categoria').value;
    const motivo = document.getElementById('motivo').value;
    const gruppoEta = document.getElementById('group-eta');

    gruppoEta.style.display = (categoria === 'dirigenti' && motivo === 'ingiustificato_dir') ? 'block' : 'none';
}

function formatValuta(valore) {
    if (!valore || isNaN(valore)) return "€ 0,00";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(valore);
}

function calcola() {
    const categoria = document.getElementById('categoria').value;
    const motivo = document.getElementById('motivo').value;
    const anzianita = parseFloat(document.getElementById('anzianita').value) || 0;
    const previdenza = document.getElementById('previdenza').value;
    const eta = parseInt(document.getElementById('eta').value) || 0;
    
    let ralInput = document.getElementById('ral').value;
    ralInput = ralInput.replace(/\./g, '').replace(/,/g, '.');
    const ral = parseFloat(ralInput) || 0;
    
    const mensilitaEuro = ral / 12;

    let mensilitaSpettanti = 0;
    let testoMesi = "";
    let esitoCustomHTML = "";
    let importoErogareText = "N/A";
    let importoTrattenereText = "N/A";
    let isSpecialeDirigente = false;

    if (categoria !== 'dirigenti') {
        if (motivo === 'dimissioni') {
            mensilitaSpettanti = 1;
            azione = "trattenere";
            esitoCustomHTML = `
                <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <p style="margin-bottom: 5px;"><strong>Preavviso dovuto dal lavoratore:</strong></p>
                    <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">1 mese (Art. 88 comma 1)</p>
                </div>
                <p><small>In caso di mancato preavviso lavorato, l'azienda può trattenere il relativo importo dalle competenze di fine rapporto.</small></p>
            `;
            if (ral > 0) {
                importoTrattenereText = formatValuta(mensilitaSpettanti * mensilitaEuro);
                importoErogareText = "Nessuna erogazione a favore dipendente";
            }
        } 
        else if (motivo === 'art86d') {
            esitoCustomHTML = `<p><strong>Mesi/Mensilità teorici:</strong> Nessun preavviso spettante. Risoluzione immediata (ex art. 2119 c.c.).</p>`;
            importoErogareText = "€ 0,00";
            importoTrattenereText = "€ 0,00";
        }
        else if (motivo === 'art86f') {
            let preavvisoBase = 0;
            if (categoria === 'quadri') preavvisoBase = anzianita <= 5 ? 5 : (anzianita <= 10 ? 6 : (anzianita <= 15 ? 7 : 8));
            if (categoria === 'terza') preavvisoBase = anzianita <= 5 ? 3 : (anzianita <= 10 ? 4 : (anzianita <= 15 ? 5 : 6));
            if (categoria === 'unificata') preavvisoBase = anzianita <= 5 ? 2 : (anzianita <= 10 ? 2.25 : (anzianita <= 15 ? 3 : 4));
            
            // Indennità ulteriore Art. 88 comma 4
            let mesiArt88 = anzianita <= 10 ? 4 : 6; 
            mensilitaSpettanti = preavvisoBase + mesiArt88;
            azione = "erogare";
            
            esitoCustomHTML = `
                <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <p style="margin-bottom: 5px;"><strong>1. Indennità sostitutiva preavviso (equiparata a Giustificato Motivo):</strong></p>
                    <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">${preavvisoBase.toFixed(2)} mensilità</p>
                </div>
                <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <p style="margin-bottom: 5px;"><strong>2. Ulteriore Indennità (Art. 88 comma 4):</strong></p>
                    <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">${mesiArt88} mensilità</p>
                </div>
                <div>
                    <p style="margin-bottom: 5px;"><strong>Totale Mesi/Mensilità spettanti:</strong></p>
                    <p style="font-size: 1.1rem; color: #155724; font-weight: bold;">${mensilitaSpettanti.toFixed(2)} mensilità</p>
                </div>
            `;
            
            if (ral > 0) {
                importoErogareText = formatValuta(mensilitaSpettanti * mensilitaEuro);
                importoTrattenereText = "Nessuna trattenuta a carico dipendente";
            }
        }
        else if (motivo === 'art86a') {
            let base = 0;
            if (categoria === 'quadri') base = Math.min(5 + Math.max(0, anzianita - 6) * 0.5, 10);
            if (categoria === 'terza') base = Math.min(Math.max(anzianita * 0.5, 2), 8);
            if (categoria === 'unificata') base = Math.min(Math.max(anzianita * (1/3), 1.5), 6);

            if (previdenza === 'massima') {
                if (categoria === 'quadri') mensilitaSpettanti = 4;
                if (categoria === 'terza') mensilitaSpettanti = 2;
                if (categoria === 'unificata') mensilitaSpettanti = 1.5; 
            } else if (previdenza === 'inferiore') {
                mensilitaSpettanti = base * 0.75;
            } else {
                mensilitaSpettanti = base;
            }
            testoMesi = `${mensilitaSpettanti.toFixed(2)} mensilità/mesi`;
        }
        else if (motivo === 'art86b') {
            if (previdenza === 'massima' || previdenza === 'inferiore') {
                if (categoria === 'quadri') mensilitaSpettanti = 4;
                if (categoria === 'terza') mensilitaSpettanti = 2;
                if (categoria === 'unificata') mensilitaSpettanti = 1.5;
            } else {
                if (categoria === 'quadri') mensilitaSpettanti = anzianita <= 5 ? 4 : (anzianita <= 10 ? 5 : 6);
                if (categoria === 'terza') mensilitaSpettanti = anzianita <= 5 ? 2 : (anzianita <= 10 ? 3 : 4);
                if (categoria === 'unificata') mensilitaSpettanti = anzianita <= 5 ? 1 : (anzianita <= 10 ? 2 : 3);
            }
            testoMesi = `${mensilitaSpettanti.toFixed(2)} mensilità/mesi`;
        }
        else if (motivo === 'art86c') {
            if (categoria === 'quadri') mensilitaSpettanti = anzianita <= 5 ? 5 : (anzianita <= 10 ? 6 : (anzianita <= 15 ? 7 : 8));
            if (categoria === 'terza') mensilitaSpettanti = anzianita <= 5 ? 3 : (anzianita <= 10 ? 4 : (anzianita <= 15 ? 5 : 6));
            if (categoria === 'unificata') mensilitaSpettanti = anzianita <= 5 ? 2 : (anzianita <= 10 ? 2.25 : (anzianita <= 15 ? 3 : 4));
            testoMesi = `${mensilitaSpettanti.toFixed(2)} mensilità/mesi`;
        }
        else if (motivo === 'art86g') {
            if (previdenza === 'massima' || previdenza === 'inferiore') {
                if (categoria === 'quadri') mensilitaSpettanti = 5;
                if (categoria === 'terza') mensilitaSpettanti = 3;
                if (categoria === 'unificata') mensilitaSpettanti = 2.5;
            } else {
                if (categoria === 'quadri') mensilitaSpettanti = Math.min(5 + Math.max(0, anzianita - 6) * 0.5, 10);
                if (categoria === 'terza') mensilitaSpettanti = anzianita <= 5 ? 2 : (anzianita <= 10 ? 3 : 4);
                if (categoria === 'unificata') mensilitaSpettanti = anzianita <= 5 ? 1 : (anzianita <= 10 ? 2 : 3);
            }
            testoMesi = `${mensilitaSpettanti.toFixed(2)} mensilità/mesi`;
        }
    } else {
        // --- DIRIGENTI ---
        if (motivo === 'dimissioni_dir') {
            mensilitaSpettanti = 3;
            testoMesi = `3 mensilità`;
            if (ral > 0) {
                importoTrattenereText = formatValuta(mensilitaSpettanti * mensilitaEuro);
                importoErogareText = "Nessuna erogazione a favore dipendente";
            }
        }
        else if (motivo === 'impresa_dir' || motivo === 'morte_dir') {
            if (previdenza === 'massima') {
                mensilitaSpettanti = motivo === 'impresa_dir' ? 6 : 7;
            } else {
                mensilitaSpettanti = Math.min(5 + Math.max(0, anzianita - 2) * 0.5, 12);
            }
            testoMesi = `${mensilitaSpettanti.toFixed(2)} mesi`;
            if (ral > 0) {
                importoErogareText = formatValuta(mensilitaSpettanti * mensilitaEuro);
                importoTrattenereText = "Nessuna trattenuta a carico dipendente";
            }
        }
        else if (motivo === 'ingiustificato_dir') {
            isSpecialeDirigente = true;
            
            // 1. Calcolo Preavviso puro
            let preavvisoBase = 0;
            if (previdenza === 'massima') {
                preavvisoBase = 6;
            } else {
                preavvisoBase = Math.min(5 + Math.max(0, anzianita - 2) * 0.5, 12);
            }

            // 2. Calcolo Indennità Supplementare
            let maggiorazione = 0;
            if (anzianita > 10) {
                if (eta === 46 || eta === 56) maggiorazione = 2;
                else if (eta === 47 || eta === 55) maggiorazione = 3;
                else if (eta === 48 || eta === 54) maggiorazione = 4;
                else if (eta === 49 || eta === 53) maggiorazione = 5;
                else if (eta === 50 || eta === 52) maggiorazione = 6;
                else if (eta === 51) maggiorazione = 7;
            }
            let indennitaMin = 7 + maggiorazione;
            let indennitaMax = 22 + maggiorazione;

            esitoCustomHTML = `
                <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <p style="margin-bottom: 5px;"><strong>1. Preavviso Contrattuale (Spettanza certa):</strong></p>
                    <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">${preavvisoBase.toFixed(2)} mesi</p>
                    <p style="color: #155724; font-size: 0.95rem;">Erogazione Preavviso: ${ral > 0 ? formatValuta(preavvisoBase * mensilitaEuro) : '(Inserire RAL)'}</p>
                </div>
                <div>
                    <p style="margin-bottom: 5px;"><strong>2. Indennità Supplementare (Esito Collegio Arbitrale):</strong></p>
                    <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">Da ${indennitaMin} a ${indennitaMax} mensilità</p>
                    <p style="color: #155724; font-size: 0.95rem;">Erogazione Indennità: ${ral > 0 ? `Tra ${formatValuta(indennitaMin * mensilitaEuro)} e ${formatValuta(indennitaMax * mensilitaEuro)}` : '(Inserire RAL)'}</p>
                    <p><small>Da corrispondersi in aggiunta al preavviso contrattuale.</small></p>
                </div>
            `;
        }
    }

    // Gestione standard se non ci sono override HTML 
    if (!esitoCustomHTML && testoMesi) {
        if (ral > 0 && importoErogareText === "N/A" && importoTrattenereText === "N/A") {
            importoErogareText = formatValuta(mensilitaSpettanti * mensilitaEuro);
            importoTrattenereText = "Nessuna trattenuta a carico dipendente";
        }
        esitoCustomHTML = `
            <p style="margin-bottom: 5px;"><strong>Mesi/Mensilità teorici:</strong></p>
            <p style="font-size: 1.1rem; color: #0056b3; font-weight: bold;">${testoMesi}</p>
        `;
    }

    let layoutRisultati = `
        <h2>Esito Calcolo</h2>
        <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom:10px; border: 1px solid #ddd;">
            ${esitoCustomHTML}
        </div>
    `;

    // Aggiungo i box colorati solo se l'importo non è già esplicitato nei blocchi sopra (es. dirigenti ingiustificato)
    if (!isSpecialeDirigente && importoErogareText !== "N/A") {
        layoutRisultati += `
            <div style="background: #e6f4ea; padding: 10px; border-radius: 8px; margin-bottom:10px; border: 1px solid #c3e6cb;">
                <p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA EROGARE:</strong></p>
                <p style="font-size: 1.1rem; color: #155724; font-weight: bold;">${importoErogareText}</p>
            </div>
            <div style="background: #f8d7da; padding: 10px; border-radius: 8px; border: 1px solid #f5c6cb;">
                <p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA TRATTENERE:</strong></p>
                <p style="font-size: 1.1rem; color: #721c24; font-weight: bold;">${importoTrattenereText}</p>
            </div>
        `;
    } else if (!isSpecialeDirigente && ral === 0) {
        const missingTesto = "(Inserire la RAL per il calcolo economico)";
        layoutRisultati += `
            <div style="background: #e6f4ea; padding: 10px; border-radius: 8px; margin-bottom:10px; border: 1px solid #c3e6cb;">
                <p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA EROGARE:</strong></p>
                <p style="font-size: 1.1rem; color: #155724; font-weight: bold;">${missingTesto}</p>
            </div>
            <div style="background: #f8d7da; padding: 10px; border-radius: 8px; border: 1px solid #f5c6cb;">
                <p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA TRATTENERE:</strong></p>
                <p style="font-size: 1.1rem; color: #721c24; font-weight: bold;">${missingTesto}</p>
            </div>
        `;
    }

    document.getElementById('input-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    document.getElementById('result-content').innerHTML = `
        ${layoutRisultati}
        <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;">
        <p><small><strong>Categoria:</strong> ${document.getElementById('categoria').options[document.getElementById('categoria').selectedIndex].text}</small></p>
        <p><small><strong>Motivo:</strong> ${document.getElementById('motivo').options[document.getElementById('motivo').selectedIndex].text}</small></p>
        <p><small><strong>Anzianità:</strong> ${anzianita} anni</small></p>
        <p><small><strong>RAL Indicata:</strong> ${ral > 0 ? formatValuta(ral) : 'Non indicata'}</small></p>
        ${(categoria === 'dirigenti' && motivo === 'ingiustificato_dir') ? `<p><small><strong>Età dirigente:</strong> ${eta} anni</small></p>` : ''}
    `;
}

function resetForm() {
    document.getElementById('input-screen').style.display = 'block';
    document.getElementById('result-screen').style.display = 'none';
}

function esportaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const resElement = document.getElementById('result-content');
    const testoPuro = resElement.innerText || resElement.textContent;

    doc.setFontSize(16);
    doc.text("Report Calcolo Preavviso/Indennità (CCNL Credito)", 10, 20);
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(testoPuro, 180);
    doc.text(splitText, 10, 35);
    doc.save("report-credito.pdf");
}
