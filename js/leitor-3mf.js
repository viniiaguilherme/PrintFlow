/* =========================================================================
   LEITOR DE .3MF (Bambu Studio)
   -------------------------------------------------------------------------
   Lê, direto no navegador, os dados que o Bambu Studio grava dentro de um
   .3mf já fatiado (o .3mf é um zip). Não envia nada pra lugar nenhum.

   Precisa do JSZip carregado antes (veja fila.html).

   lerArquivo3mf(file) devolve uma Promise com:
   {
     tempoSeg:  1098,          // tempo de impressão estimado, em segundos
     pesoG:     3.82,          // filamento total, em gramas
     camadaMm:  0.2,           // altura de camada (null se não achar)
     filamentos: [             // só os filamentos usados na impressão
       { slot: 1, tipo: 'PLA', hex: '#FFFFFF', g: 2.89 },
       { slot: 2, tipo: 'PLA', hex: '#042F56', g: 0.93 }
     ]
   }
   Em caso de problema, a Promise é rejeitada com Error(mensagem em português).
   ========================================================================= */
function lerArquivo3mf(file) {
  var ERRO_INVALIDO = 'Arquivo inválido. Envie um .3mf exportado do Bambu Studio já fatiado.';
  var ERRO_NAO_FATIADO = 'Este arquivo não está fatiado. No Bambu Studio, clique em "Fatiar placa" e exporte de novo.';

  if (typeof JSZip === 'undefined') {
    return Promise.reject(new Error('Não foi possível carregar o leitor de arquivos. Recarregue a página.'));
  }

  return JSZip.loadAsync(file).then(function (zip) {
    var sliceInfo = zip.file('Metadata/slice_info.config');
    if (!sliceInfo) throw new Error(ERRO_NAO_FATIADO);

    return sliceInfo.async('string').then(function (xmlTexto) {
      var doc = new DOMParser().parseFromString(xmlTexto, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) throw new Error(ERRO_INVALIDO);

      var placas = doc.getElementsByTagName('plate');
      if (placas.length === 0) throw new Error(ERRO_NAO_FATIADO);
      if (placas.length > 1) {
        throw new Error('Este arquivo tem mais de uma placa. Exporte uma placa por arquivo.');
      }
      var placa = placas[0];

      // <metadata key="prediction" value="1098"/>, <metadata key="weight" value="3.82"/>
      var meta = {};
      Array.prototype.forEach.call(placa.getElementsByTagName('metadata'), function (m) {
        meta[m.getAttribute('key')] = m.getAttribute('value');
      });

      var tempoSeg = Math.round(parseFloat(meta.prediction));

      // <filament id="1" type="PLA" color="#FFFFFF" used_g="2.89" .../>
      var filamentos = [];
      Array.prototype.forEach.call(placa.getElementsByTagName('filament'), function (f) {
        var usado = parseFloat(f.getAttribute('used_g'));
        if (!(usado > 0)) return;

        var cor = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(f.getAttribute('color') || '');
        filamentos.push({
          slot: parseInt(f.getAttribute('id'), 10),
          tipo: (f.getAttribute('type') || 'Outro').trim() || 'Outro',
          hex: cor ? '#' + cor[1].toUpperCase() : null,
          g: Math.round(usado * 100) / 100
        });
      });

      if (!(tempoSeg > 0) || filamentos.length === 0) throw new Error(ERRO_NAO_FATIADO);

      filamentos.sort(function (a, b) { return a.slot - b.slot; });
      filamentos.forEach(function (f) {
        if (!(f.slot >= 1 && f.slot <= 4)) {
          throw new Error('Este arquivo usa filamentos fora dos slots 1 a 4, que são os suportados.');
        }
      });

      var soma = filamentos.reduce(function (acc, f) { return acc + f.g; }, 0);
      var pesoG = parseFloat(meta.weight);
      if (!(pesoG > 0)) pesoG = soma;
      pesoG = Math.round(pesoG * 100) / 100;

      // Altura de camada (opcional): fica no project_settings.config, que é um JSON
      var arqConfig = zip.file('Metadata/project_settings.config');
      var camadaPromise = arqConfig
        ? arqConfig.async('string').then(function (txt) {
            try {
              var v = parseFloat(JSON.parse(txt).layer_height);
              return v > 0 ? v : null;
            } catch (e) { return null; }
          })
        : Promise.resolve(null);

      return camadaPromise.then(function (camadaMm) {
        return { tempoSeg: tempoSeg, pesoG: pesoG, camadaMm: camadaMm, filamentos: filamentos };
      });
    });
  }).catch(function (erro) {
    // Erros nossos já têm mensagem pronta; o resto (ex.: não é um zip) vira "arquivo inválido"
    if (erro && erro.message && erro.message.indexOf('JSZip') === -1 &&
        /fatiado|placa|slots|leitor/.test(erro.message)) {
      throw erro;
    }
    throw new Error(ERRO_INVALIDO);
  });
}
