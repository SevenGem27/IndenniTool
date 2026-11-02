/*
 * IndenniTool - Calcolo preavviso e indennità
 * © 2026 M. Monferrini. Tutti i diritti riservati.
 *
 * Fonti:
 *  - CCNL 23 novembre 2023 per i quadri direttivi e per il personale delle aree
 *    professionali (testo coordinato 14 luglio 2025): artt. 86, 87, 88 e Allegato 6.
 *  - CCNL dirigenti 13 luglio 2015, aggiornato con l'accordo di rinnovo 15 luglio 2025:
 *    artt. 26 e 28.
 *
 * Tutti i valori sono espressi in mensilità (mesi). La mensilità è stimata come RAL / 12.
 */

'use strict';

// ---------------------------------------------------------------------------
// Motivi di risoluzione
// ---------------------------------------------------------------------------

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
    { value: 'impresa_dir', text: "Risoluzione ad iniziativa dell'impresa non per giusta causa (Art. 26 c. 1)" },
    { value: 'ingiustificato_dir', text: 'Licenziamento riconosciuto ingiustificato dal Collegio (Art. 28)' },
    { value: 'morte_dir', text: 'Morte del dirigente (Art. 26 c. 5)' }
];

const opzioniPrevidenzaAree = [
    { value: 'assente', text: 'Assente' },
    { value: 'massima', text: 'Presente (Misura Massima)' },
    { value: 'inferiore', text: 'Presente (Misura Inferiore alla Massima)' }
];

// Per i dirigenti l'art. 26 distingue solo tra diritto o meno, "con effetto immediato",
// al trattamento di previdenza aziendale migliorativo.
const opzioniPrevidenzaDirigenti = [
    { value: 'assente', text: 'Assente (o non con effetto immediato)' },
    { value: 'massima', text: 'Presente con effetto immediato' }
];

// Motivi per cui conta la norma di raccordo dell'Area Unificata (tabelle dell'Allegato 6)
const MOTIVI_ALLEGATO_6 = ['art86a', 'art86b', 'art86c', 'art86f', 'art86g'];

// ---------------------------------------------------------------------------
// Tabelle Allegato 6 (CCNL 23/11/2023) — categorie: 'quadri', 'terza', 'unificata'
// ---------------------------------------------------------------------------

// Fasce "fino a 5 / da 5 a 10 / oltre 10 anni"
function fascia3(anz, v5, v10, oltre) {
    if (anz <= 5) return v5;
    if (anz <= 10) return v10;
    return oltre;
}

// Fasce "fino a 5 / da 5 a 10 / da 10 a 15 / oltre 15 anni"
function fascia4(anz, v5, v10, v15, oltre) {
    if (anz <= 5) return v5;
    if (anz <= 10) return v10;
    if (anz <= 15) return v15;
    return oltre;
}

// Quadri: 5 mensilità fino a 6 anni, + 1/2 mensilità per ogni anno successivo, max altre 5
function scalaQuadriLettA(anz) {
    return Math.min(5 + Math.max(0, anz - 6) * 0.5, 10);
}

// Comma 1 — lett. a) superamento comporto / invalidità
function preavvisoLettA(cat, anz, previdenza) {
    if (previdenza === 'massima') {
        return { quadri: 4, terza: 2, unificata: 1.5 }[cat];
    }
    let base;
    if (cat === 'quadri') base = scalaQuadriLettA(anz);
    else if (cat === 'terza') base = Math.min(Math.max(anz * 0.5, 2), 8);
    else base = Math.min(Math.max(anz / 3, 1.5), 6);
    // Previdenza in misura inferiore alla massima: trattamento sub c) ridotto del 25%
    return previdenza === 'inferiore' ? base * 0.75 : base;
}

// Comma 2 — lett. b) requisiti pensionistici
function preavvisoLettB(cat, anz, previdenza) {
    if (previdenza === 'massima' || previdenza === 'inferiore') {
        return { quadri: 4, terza: 2, unificata: 1.5 }[cat];
    }
    if (cat === 'quadri') return fascia3(anz, 4, 5, 6);
    if (cat === 'terza') return fascia3(anz, 2, 3, 4);
    return fascia3(anz, 1, 2, 3);
}

// Comma 3 — lett. c) giustificato motivo
function preavvisoLettC(cat, anz) {
    if (cat === 'quadri') return fascia4(anz, 5, 6, 7, 8);
    if (cat === 'terza') return fascia4(anz, 3, 4, 5, 6);
    return fascia4(anz, 2, 2.25, 3, 4);
}

// Comma 4 — lett. g) morte
function preavvisoLettG(cat, anz, previdenza) {
    if (previdenza === 'massima' || previdenza === 'inferiore') {
        return { quadri: 5, terza: 3, unificata: 2.5 }[cat];
    }
    if (cat === 'quadri') return scalaQuadriLettA(anz);
    if (cat === 'terza') return fascia3(anz, 2, 3, 4);
    return fascia3(anz, 1, 2, 3);
}

// Art. 88 c. 4 — ulteriore trattamento per dimissioni per giusta causa
function ulterioreLettF(anz) {
    return anz <= 10 ? 4 : 6;
}

// ---------------------------------------------------------------------------
// Dirigenti (CCNL 13/07/2015, agg. 15/07/2025)
// ---------------------------------------------------------------------------

// Art. 26 c. 1: 5 mesi fino a 2 anni, + 1/2 mese per ogni anno successivo, max altri 7 (tot. 12)
function preavvisoDirigente(anz, previdenza) {
    if (previdenza === 'massima') return 6;
    return Math.min(5 + Math.max(0, anz - 2) * 0.5, 12);
}

// Art. 28: aumento automatico dell'indennità supplementare in base all'età
// (solo con anzianità superiore a 10 anni)
function aumentoEtaDirigente(anz, eta) {
    if (anz <= 10) return 0;
    const tabella = { 46: 2, 56: 2, 47: 3, 55: 3, 48: 4, 54: 4, 49: 5, 53: 5, 50: 6, 52: 6, 51: 7 };
    return tabella[eta] || 0;
}

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------

function el(id) {
    return document.getElementById(id);
}

function testoSelezionato(selectId) {
    const s = el(selectId);
    return s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '';
}

function popolaSelect(select, opzioni) {
    const precedente = select.value;
    select.innerHTML = '';
    opzioni.forEach(o => {
        const option = document.createElement('option');
        option.value = o.value;
        option.textContent = o.text;
        select.appendChild(option);
    });
    if (opzioni.some(o => o.value === precedente)) select.value = precedente;
}

function formatValuta(valore) {
    if (!valore || isNaN(valore)) return '€ 0,00';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(valore);
}

// Formatta un numero di mensilità con la virgola decimale e, se frazionario,
// l'equivalente approssimato in mesi e giorni (mese convenzionale di 30 giorni).
function formatMesi(n, unita) {
    const testo = n.toLocaleString('it-IT', { maximumFractionDigits: 2 }) + ' ' + unita;
    const interi = Math.floor(n + 1e-9);
    const giorni = Math.round((n - interi) * 30);
    if (giorni === 0) return testo;
    const parteMesi = interi === 0 ? '' : interi + (interi === 1 ? ' mese e ' : ' mesi e ');
    return testo + ' (circa ' + parteMesi + giorni + (giorni === 1 ? ' giorno' : ' giorni') + ')';
}

/*
 * Interpreta la RAL inserita in formato italiano o internazionale:
 *  "35.000,50" "35000,50" "35000.50" "35.000" "35,000.50" "€ 35 000" → numero
 */
function parseImporto(testo) {
    let s = String(testo || '').replace(/[€\s']/g, '');
    if (!s) return 0;
    const ultimaVirgola = s.lastIndexOf(',');
    const ultimoPunto = s.lastIndexOf('.');
    if (ultimaVirgola !== -1 && ultimoPunto !== -1) {
        // Entrambi presenti: l'ultimo separatore è quello decimale
        if (ultimaVirgola > ultimoPunto) s = s.replace(/\./g, '').replace(',', '.');
        else s = s.replace(/,/g, '');
    } else if (ultimaVirgola !== -1) {
        // Solo virgole: "35,000" con gruppi da 3 è separatore di migliaia, altrimenti decimale
        s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (ultimoPunto !== -1) {
        // Solo punti: "35.000" o "1.250.000" sono migliaia, "35000.50" è decimale
        s = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s;
    }
    const n = parseFloat(s);
    return isNaN(n) || n < 0 ? 0 : n;
}

function visibile(id) {
    return el(id).style.display !== 'none';
}

function leggiNumeroNonNegativo(id) {
    const n = parseFloat(String(el(id).value).replace(',', '.'));
    return isNaN(n) || n < 0 ? 0 : n;
}

// ---------------------------------------------------------------------------
// Gestione del modulo
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    el('categoria').addEventListener('change', onCategoriaChange);
    el('motivo').addEventListener('change', onMotivoChange);
    onCategoriaChange();
});

function onCategoriaChange() {
    const dirigente = el('categoria').value === 'dirigenti';
    popolaSelect(el('motivo'), dirigente ? motiviDirigenti : motiviAree);
    // Le opzioni vengono ricreate (non nascoste via CSS) perché Safari su iOS
    // ignora display:none sugli elementi <option>.
    popolaSelect(el('previdenza'), dirigente ? opzioniPrevidenzaDirigenti : opzioniPrevidenzaAree);
    onMotivoChange();
}

function onMotivoChange() {
    const categoria = el('categoria').value;
    const motivo = el('motivo').value;
    el('group-eta').style.display = categoria === 'dirigenti' && motivo === 'ingiustificato_dir' ? 'block' : 'none';
    el('group-ex2area').style.display = categoria === 'unificata' && MOTIVI_ALLEGATO_6.includes(motivo) ? 'flex' : 'none';
    el('group-pensione').style.display = categoria !== 'dirigenti' && motivo === 'art86f' ? 'flex' : 'none';
}

// ---------------------------------------------------------------------------
// Blocchi HTML del risultato
// ---------------------------------------------------------------------------

const STILE_SEPARATORE = 'border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;';
const STILE_VALORE = 'font-size: 1.1rem; color: #1B2B4F; font-weight: bold;';
const STILE_TOTALE = 'font-size: 1.1rem; color: #2E9169; font-weight: bold;';

function blocco(titolo, valore, opzioni) {
    const o = opzioni || {};
    return '<div style="' + (o.ultimo ? '' : STILE_SEPARATORE) + '">' +
        '<p style="margin-bottom: 5px;"><strong>' + titolo + '</strong></p>' +
        '<p style="' + (o.totale ? STILE_TOTALE : STILE_VALORE) + '">' + valore + '</p>' +
        (o.extra || '') +
        '</div>';
}

function nota(testo) {
    return '<p><small>' + testo + '</small></p>';
}

function riepilogo(etichetta, valore) {
    return '<p class="riepilogo"><small><strong>' + etichetta + ':</strong> ' + valore + '</small></p>';
}

// ---------------------------------------------------------------------------
// Calcolo
// ---------------------------------------------------------------------------

function calcola() {
    const categoria = el('categoria').value;
    const motivo = el('motivo').value;
    const anzianita = leggiNumeroNonNegativo('anzianita');
    const eta = Math.floor(leggiNumeroNonNegativo('eta'));
    const previdenza = el('previdenza').value;
    const ral = parseImporto(el('ral').value);
    const mensile = ral / 12;
    const ex2Area = visibile('group-ex2area') && el('ex2area').checked;
    const requisitiPensione = visibile('group-pensione') && el('requisiti-pensione').checked;

    // Norma di raccordo (art. 100 c. 5): per chi era inquadrato al 31/12/2019 nel 3° livello
    // retributivo della 2ª area continua ad applicarsi l'Allegato 6 del CCNL 31/03/2015,
    // che li accomunava alla 3ª area professionale.
    const catTabelle = categoria === 'unificata' && ex2Area ? 'terza' : categoria;

    let mesi = 0;              // mensilità teoriche
    let dettaglio = '';        // HTML del dettaglio
    let daErogare = 'N/A';
    let daTrattenere = 'N/A';
    let mostraImporti = true;  // riquadri "da erogare / da trattenere"
    const note = [];

    if (ex2Area) {
        note.push("Applicate le misure dell'Allegato 6 del CCNL 31/03/2015 per la 2ª area professionale, 3° livello retributivo (norma di raccordo, art. 100 c. 5).");
    }

    if (categoria !== 'dirigenti') {
        switch (motivo) {
            case 'dimissioni':
                mesi = 1;
                dettaglio = blocco('Preavviso dovuto dal lavoratore:', '1 mese (Art. 88 comma 1)') +
                    nota("In caso di mancato preavviso lavorato, l'azienda può trattenere il relativo importo dalle competenze di fine rapporto (art. 2118 c.c.).");
                if (ral > 0) {
                    daTrattenere = formatValuta(mesi * mensile);
                    daErogare = 'Nessuna erogazione a favore dipendente';
                }
                break;

            case 'art86d':
                dettaglio = '<p><strong>Mesi/Mensilità teorici:</strong> Nessun preavviso spettante. Risoluzione immediata (ex art. 2119 c.c.).</p>';
                daErogare = '€ 0,00';
                daTrattenere = '€ 0,00';
                break;

            case 'art86f':
                if (requisitiPensione) {
                    // Art. 88 c. 5: spetta il trattamento previsto per la lett. b)
                    mesi = preavvisoLettB(catTabelle, anzianita, previdenza);
                    dettaglio = blocco('Indennità sostitutiva del preavviso (Art. 88 c. 5, misure lett. b):', formatMesi(mesi, 'mensilità'), { ultimo: true }) +
                        nota("Il lavoratore in possesso dei requisiti pensionistici riceve il trattamento previsto per la risoluzione ai sensi della lett. b), in luogo di quello dell'art. 88 c. 4.");
                } else {
                    const sostitutiva = preavvisoLettC(catTabelle, anzianita);
                    const ulteriore = ulterioreLettF(anzianita);
                    mesi = sostitutiva + ulteriore;
                    dettaglio =
                        blocco('1. Indennità sostitutiva preavviso (equiparata a Giustificato Motivo):', formatMesi(sostitutiva, 'mensilità')) +
                        blocco('2. Ulteriore Indennità (Art. 88 comma 4):', formatMesi(ulteriore, 'mensilità')) +
                        blocco('Totale Mesi/Mensilità spettanti:', formatMesi(mesi, 'mensilità'), { totale: true, ultimo: true });
                }
                if (ral > 0) {
                    daErogare = formatValuta(mesi * mensile);
                    daTrattenere = 'Nessuna trattenuta a carico dipendente';
                }
                break;

            case 'art86a':
                mesi = preavvisoLettA(catTabelle, anzianita, previdenza);
                break;
            case 'art86b':
                mesi = preavvisoLettB(catTabelle, anzianita, previdenza);
                break;
            case 'art86c':
                mesi = preavvisoLettC(catTabelle, anzianita);
                break;
            case 'art86g':
                mesi = preavvisoLettG(catTabelle, anzianita, previdenza);
                break;
        }
    } else {
        switch (motivo) {
            case 'dimissioni_dir':
                mesi = 3;
                dettaglio = blocco('Preavviso dovuto dal dirigente:', '3 mesi (Art. 26 comma 2)') +
                    nota("In caso di mancato preavviso, l'impresa ha diritto a un'indennità pari alla retribuzione del periodo non lavorato (Art. 26 comma 3).");
                if (ral > 0) {
                    daTrattenere = formatValuta(mesi * mensile);
                    daErogare = 'Nessuna erogazione a favore dipendente';
                }
                break;

            case 'impresa_dir':
                mesi = preavvisoDirigente(anzianita, previdenza);
                break;

            case 'morte_dir':
                // Art. 26 c. 6-7: misure della lett. a), oppure 7 mensilità con previdenza
                mesi = previdenza === 'massima' ? 7 : preavvisoDirigente(anzianita, 'assente');
                break;

            case 'ingiustificato_dir': {
                mostraImporti = false;
                const preavviso = preavvisoDirigente(anzianita, previdenza);
                const aumento = aumentoEtaDirigente(anzianita, eta);
                const min = 7 + aumento;
                const max = 22 + aumento;
                dettaglio =
                    blocco('1. Preavviso Contrattuale (Spettanza certa):', formatMesi(preavviso, 'mesi'), {
                        extra: '<p style="color: #2E9169; font-size: 0.95rem;">Erogazione Preavviso: ' +
                            (ral > 0 ? formatValuta(preavviso * mensile) : '(Inserire RAL)') + '</p>'
                    }) +
                    blocco('2. Indennità Supplementare (Esito Collegio Arbitrale):', 'Da ' + min + ' a ' + max + ' mensilità', {
                        ultimo: true,
                        extra: '<p style="color: #2E9169; font-size: 0.95rem;">Erogazione Indennità: ' +
                            (ral > 0 ? 'Tra ' + formatValuta(min * mensile) + ' e ' + formatValuta(max * mensile) : '(Inserire RAL)') + '</p>' +
                            nota('Da corrispondersi in aggiunta al preavviso contrattuale.' +
                                (aumento > 0 ? ' Include l\'aumento automatico di ' + aumento + ' mensilità per età (Art. 28).' : ''))
                    });
                break;
            }
        }
    }

    // Casi standard: indennità di mancato preavviso a favore del lavoratore
    if (!dettaglio) {
        const unita = categoria === 'dirigenti' ? 'mesi' : 'mensilità/mesi';
        dettaglio = '<p style="margin-bottom: 5px;"><strong>Mesi/Mensilità teorici:</strong></p>' +
            '<p style="' + STILE_VALORE + '">' + formatMesi(mesi, unita) + '</p>';
        if (ral > 0) {
            daErogare = formatValuta(mesi * mensile);
            daTrattenere = 'Nessuna trattenuta a carico dipendente';
        }
    }

    note.forEach(n => { dettaglio += nota(n); });

    let html = '<h2>Esito Calcolo</h2>' +
        '<div style="background: white; padding: 10px; border-radius: 8px; margin-bottom:10px; border: 1px solid #ddd;">' +
        dettaglio + '</div>';

    if (mostraImporti) {
        const testoErogare = ral > 0 ? daErogare : '(Inserire la RAL per il calcolo economico)';
        const testoTrattenere = ral > 0 ? daTrattenere : '(Inserire la RAL per il calcolo economico)';
        html +=
            '<div style="background: #e6f4ea; padding: 10px; border-radius: 8px; margin-bottom:10px; border: 1px solid #c3e6cb;">' +
            '<p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA EROGARE:</strong></p>' +
            '<p style="font-size: 1.1rem; color: #2E9169; font-weight: bold;">' + testoErogare + '</p></div>' +
            '<div style="background: #f8d7da; padding: 10px; border-radius: 8px; border: 1px solid #f5c6cb;">' +
            '<p style="margin-bottom: 5px;"><strong>Importo Eventualmente DA TRATTENERE:</strong></p>' +
            '<p style="font-size: 1.1rem; color: #721c24; font-weight: bold;">' + testoTrattenere + '</p></div>';
    }

    html += '<hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;">';
    datiRiepilogo().forEach(r => { html += riepilogo(r.k, r.v); });

    el('input-screen').style.display = 'none';
    el('result-screen').style.display = 'block';
    el('result-content').innerHTML = html;
    window.scrollTo(0, 0);
}

// Dati inseriti, usati sia nella schermata del risultato sia nel PDF
function datiRiepilogo() {
    const categoria = el('categoria').value;
    const ral = parseImporto(el('ral').value);
    const righe = [
        { k: 'Categoria', v: testoSelezionato('categoria') },
        { k: 'Motivo', v: testoSelezionato('motivo') },
        { k: 'Anzianità di effettivo servizio', v: leggiNumeroNonNegativo('anzianita') + ' anni' },
        { k: 'RAL indicata', v: ral > 0 ? formatValuta(ral) : 'Non indicata' },
        { k: 'Previdenza aziendale migliorativa', v: testoSelezionato('previdenza') }
    ];
    if (visibile('group-eta')) {
        righe.push({ k: 'Età dirigente', v: Math.floor(leggiNumeroNonNegativo('eta')) + ' anni' });
    }
    if (visibile('group-ex2area') && el('ex2area').checked) {
        righe.push({ k: 'Norma di raccordo', v: 'Inquadrato al 31/12/2019 nella 2ª area, 3° livello retributivo' });
    }
    if (visibile('group-pensione') && el('requisiti-pensione').checked) {
        righe.push({ k: 'Requisiti pensionistici', v: 'Sì (Art. 88 c. 5)' });
    }
    if (categoria === 'dirigenti') {
        righe[2].k = 'Anzianità di servizio';
    }
    return righe;
}

function resetForm() {
    el('input-screen').style.display = 'block';
    el('result-screen').style.display = 'none';
}

// ---------------------------------------------------------------------------
// Esportazione PDF
// ---------------------------------------------------------------------------

function esportaPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Impossibile generare il PDF: libreria non disponibile. Ricarica la pagina e riprova.');
        return;
    }
    const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const MARGINE_BASSO = 265;
    let y;

    function intestazione() {
        doc.setFillColor(27, 43, 79);
        doc.rect(0, 0, 210, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('IndenniTool', 15, 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(180, 195, 220);
        doc.text('REPORT DI CALCOLO PREAVVISO E INDENNITÀ - VALORE INDICATIVO', 15, 28);
        y = 52;
    }

    function spazio(altezza) {
        if (y + altezza > MARGINE_BASSO) {
            doc.addPage();
            intestazione();
        }
    }

    function titoloSezione(testo) {
        spazio(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(27, 43, 79);
        doc.text(testo, 15, y);
        y += 4;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(15, y, 195, y);
        y += 10;
    }

    intestazione();

    // 1. Dati inseriti
    titoloSezione('1. RIEPILOGO DATI CONTRATTUALI');
    doc.setFontSize(10);
    datiRiepilogo().forEach(r => {
        doc.setFont('helvetica', 'bold');
        const etichetta = doc.splitTextToSize(r.k + ':', 62);
        doc.setFont('helvetica', 'normal');
        const valore = doc.splitTextToSize(r.v, 112);
        const altezza = Math.max(etichetta.length, valore.length) * 5 + 2;
        spazio(altezza);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 43, 79);
        doc.text(etichetta, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(valore, 82, y);
        y += altezza;
    });

    // 2. Risultati
    y += 8;
    titoloSezione('2. RISULTATI ECONOMICI E SPETTANZE');
    el('result-content').querySelectorAll('p').forEach(p => {
        if (p.classList.contains('riepilogo')) return;
        const testo = (p.innerText || p.textContent).trim();
        if (!testo) return;
        const strong = p.querySelector('strong');
        if (strong && strong.textContent.trim() === testo) {
            spazio(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(70, 80, 95);
            doc.text(doc.splitTextToSize(testo, 180), 15, y);
            y += 5.5;
            return;
        }
        const isNota = !!p.querySelector('small');
        doc.setFont('helvetica', isNota ? 'normal' : 'bold');
        doc.setFontSize(isNota ? 9 : 12);
        if (isNota) doc.setTextColor(100, 116, 139);
        else if (testo.includes('Nessuna trattenuta') || testo.includes('Nessuna erogazione')) doc.setTextColor(27, 43, 79);
        else if (p.closest('div[style*="#f8d7da"]')) doc.setTextColor(114, 28, 36);
        else if (testo.includes('€')) doc.setTextColor(46, 145, 105);
        else doc.setTextColor(27, 43, 79);
        const righe = doc.splitTextToSize(testo, 180);
        spazio(righe.length * 5 + 6);
        doc.text(righe, 15, y);
        y += righe.length * 5 + 6;
    });

    // Piè di pagina su tutte le pagine
    const data = new Date().toLocaleDateString('it-IT');
    const pagine = doc.getNumberOfPages();
    for (let i = 1; i <= pagine; i++) {
        doc.setPage(i);
        doc.setDrawColor(203, 213, 225);
        doc.line(15, 272, 195, 272);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(140, 150, 165);
        doc.text(doc.splitTextToSize('Risultato indicativo basato sul CCNL del credito: non costituisce parere legale, contabile o consulenza professionale vincolante.', 150), 15, 277);
        doc.text('Documento generato da IndenniTool in data ' + data, 15, 286);
        doc.text('Pagina ' + i + ' di ' + pagine, 175, 286);
    }

    doc.save('Report-IndenniTool.pdf');
}
