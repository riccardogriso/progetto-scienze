# NeuroLab — Simulatore del potenziale d’azione

Aprire **index.html** in un browser desktop moderno. L’applicazione è contenuta interamente nel file: funziona offline, senza installazioni, CDN, account o servizi esterni. L’unico collegamento esterno è il video di approfondimento facoltativo.

Se il browser aziendale blocca gli indirizzi `file://`, eseguire dalla cartella del progetto `python3 -m http.server 8000 --bind 127.0.0.1` e aprire il server locale nel browser.

## Utilizzo

- Il tempo parte automaticamente dal riposo e continua senza fermarsi a 10 ms. Il grafico mostra una finestra scorrevole di 10 ms.
- **Genera impulso** applica uno stimolo al tempo corrente senza azzerare tensione o canali. Puoi ripeterlo dopo la fine dello stimolo precedente e osservare recupero e refrattarietà. In pausa lo stimolo viene inserito ma il tempo resta fermo: usa Riprendi o Avanza. L’istante viene allineato al passo numerico di 0,005 ms.
- **Pausa / Riprendi**, **Avanza di 0,1 ms**, velocità e barra temporale controllano tutte le viste insieme. Trascinare la barra mette in pausa; Reset cancella gli stimoli e lo storico, tornando al riposo con tempo in movimento, senza modificare i parametri. Lo storico conserva gli ultimi 120 ms biologici; la simulazione continua oltre questo limite. Se riavvolgi e inserisci un nuovo impulso, il seguito della registrazione viene sostituito a partire da quel punto.
- **Esperimento** abilita conduttanze massime, intensità e durata dello stimolo, confronto tratteggiato e ripristino dei valori. Ogni modifica avvia una nuova registrazione al tempo zero. La curva di riferimento usa parametri normali e riceve stimoli agli stessi istanti della simulazione sperimentale. Osservazione ripristina i parametri normali.
- Le cinque velocità sono didattiche: a 1×, 1 ms biologico richiede 1 secondo reale.

## Modello

Hodgkin–Huxley, integrazione RK4 a 0,005 ms con variabili di attivazione e inattivazione; stimoli rettangolari inseriti su comando. Capacità 1 µF/cm², conduttanze massime Na 120 e K 36 mS/cm², perdita 0,3 mS/cm². Tensioni classiche traslate di −5 mV, cinetica dei canali moltiplicata per 2 (circa 12,6 °C con Q10 = 3). Stimolo normale 20 µA/cm² per 0,5 ms. Riposo −70 mV, picco circa +30,2 mV, minimo −80,9 mV, a circa 9 ms dallo stimolo la tensione è −71,5 mV. Il tempo continua fino al recupero completo e oltre.

Grafico, membrana, circuito e indicatori leggono un unico campione interpolato della soluzione. La velocità di riproduzione non modifica l’integrazione. Lo stato visivo è una funzione del campione scientifico registrato, quindi pausa e riavvolgimento sono deterministici. Apertura, etichetta e transito degli ioni condividono un unico criterio di conduttanza. Le correnti basali sotto la soglia visiva (0,2% di apertura Na/Ca, 2% K) sono incluse nel calcolo ma non animate. Le particelle sono centrate nel varco e non attraversano un canale rappresentato come chiuso. Anche i marcatori del circuito usano lo stesso flusso integrato con scala visiva compressa.

Calcio: attivazione didattica separata dipendente dalla tensione, senza contributo al potenziale assonale. Pompa: ciclo illustrativo 3 Na fuori / 2 K dentro e consumo ATP, senza contributo alle correnti rapide. Particelle e cariche sono simboliche; non simulano il numero effettivo degli ioni né variazioni delle concentrazioni. Le modifiche sperimentali sono applicate a partire dallo stato normale iniziale; possono spostare l’equilibrio anche in assenza di stimolo. I limiti sono dichiarati anche nell’interfaccia.

Riferimento: Hodgkin e Huxley (1952), Journal of Physiology 117, 500–544. Il video indicato dall’utente è collegato nell’app come approfondimento, non è stato usato come fonte verificata.

## Verifica

Con Node.js: `node --test tests/model.test.cjs`. Undici test coprono riposo, impulso, soglia, blocco del sodio, correnti, estremi degli slider, singolarità rimovibili e convergenza numerica, oltre a stimoli ritardati e ripetuti, indipendenza dai blocchi di avanzamento, correnti basali e storico limitato.

Test dell’interfaccia: `node tests/browser.cjs`, con Playwright disponibile e Chromium installato. Il percorso predefinito è `/usr/bin/chromium`; impostare `CHROMIUM_PATH` per un percorso diverso. Il test avvia e chiude un server HTTP temporaneo, verifica tutti i controlli, pausa immobile, riavvolgimento deterministico, coerenza numerica, avanzamento oltre 10 ms, recupero dopo lo stimolo, coerenza tra apertura e particelle in 320 fotogrammi e assenza di sforamento mobile. Salva due schermate nella cartella temporanea di sistema. Playwright è richiesto solo per questi test, non per usare l’applicazione.

Validato in Chromium nell’ambiente cloud. Altri browser desktop non sono stati eseguiti in questa sessione.
