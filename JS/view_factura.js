// ===== Listado / Buscador de facturas guardadas =====
document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("facturasContainer");
  const inputBuscar = document.getElementById("buscadorCliente");
  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];

  function mostrarFacturas(filtradas) {
    if (!contenedor) return;
    contenedor.innerHTML = "";

    filtradas.forEach((factura, index) => {
      const div = document.createElement("div");
      div.classList.add("factura-card");

      div.innerHTML = `
        <h3>Factura N° ${factura.numeroFactura}</h3>
        <p><strong>Cliente:</strong> ${factura.nombreCliente || ""}</p>
        <p><strong>Teléfono:</strong> ${factura.numeroTelefono || ""}</p>
        ${factura.rutCliente ? `<p><strong>RUT Cliente:</strong> ${factura.rutCliente}</p>` : ""}
        ${factura.empresaCliente ? `<p><strong>Empresa:</strong> ${factura.empresaCliente}</p>` : ""}
        <p><strong>Fecha:</strong> ${factura.fechaFactura || ""}</p>
        <p><strong>Total:</strong> $${(Number(factura.total) || 0).toLocaleString('es-UY', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        ${factura.cuotas > 1 ? `<p><strong>Cuota actual:</strong> ${factura.cuotaActual || 1}/${factura.cuotas}</p>` : ""}
        <button onclick="verFactura(${index})">Ver factura</button>
        <button onclick="descargarFacturaPDF(${index})" style="margin-left: 10px;">Descargar PDF</button>
        <button onclick="eliminarFactura(${index})" style="margin-left: 10px; color: red;">Eliminar</button>
        ${factura.cuotas > 1 ? `
          <div style="margin-top:10px;">
            <button onclick="mostrarFormularioCuota(${index})">Modificar cuotas pagadas</button>
            <div id="formCuota-${index}" style="display: none; margin-top: 5px;">
              <label>Cuota pagada:</label>
              <input type="number" id="nuevaCuota-${index}" min="1" max="${factura.cuotas}" value="${factura.cuotaActual || 1}">
              <button onclick="actualizarCuota(${index})">Guardar</button>
            </div>
          </div>
        ` : ""}
        <hr>
      `;

      contenedor.appendChild(div);
    });
  }

  if (inputBuscar) {
    inputBuscar.addEventListener("input", () => {
      const texto = (inputBuscar.value || "").toLowerCase();
      const filtradas = facturas.filter(f => {
        const nombre = (f.nombreCliente || "").toLowerCase();
        const telefono = f.numeroTelefono || "";
        const fecha = f.fechaFactura || "";
        return nombre.includes(texto) || telefono.includes(texto) || fecha.includes(texto);
      });
      mostrarFacturas(filtradas);
    });
  }

  mostrarFacturas(facturas);
});

// ===== Ver factura (misma plantilla que main.js) =====
function verFactura(index) {
  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
  const factura = facturas[index];
  mostrarFactura(factura);
}

function mostrarFactura(factura) {
  const facturaHTML = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura ${factura.numeroFactura}</title>
      <link rel="stylesheet" href="./CSS/factura_ref.css">
      <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    </head>
    <body>
      <div id="factura_container" class="ref-doc">
        <div class="top-row">
          <div class="issuer-block">
            <div class="logo-box">
              <img src="./img/jslogo.png" alt="Logo" />
            </div>
            <div class="issuer-lines">
              <div class="issuer-name">JS AIRES PANDO</div>
              <div class="issuer-addr">Pando, Canelones - 093 365 696</div>
              <div class="issuer-site">www.aireacondicionadopando.com</div>
            </div>
          </div>
          <div class="ticket-block">
            <div class="ruc">RUT Emisor: <span class="mono">${factura.rut || ""}</span></div>
            <div class="ticket-title">E-TICKET</div>
            <table class="ticket-meta">
              <tr><th>Serie</th><th>Número</th><th>Pago</th><th>Moneda</th></tr>
              <tr>
                <td>A</td>
                <td class="mono">${factura.numeroFactura}</td>
                <td>${(factura.tipoPago || "").toUpperCase()}</td>
                <td>UYU</td>
              </tr>
            </table>
            <div class="consumo">CONSUMO FINAL:<div class="mono">0</div></div>
            <div class="cliente-mini">
              <div><h3>Cliente: ${factura.nombreCliente || ""}</h3></div>
              ${factura.empresaCliente ? `<div><h3>Empresa: ${factura.empresaCliente}</h3></div>` : ""}
              ${factura.rutCliente ? `<div><h3>RUT: ${factura.rutCliente}</h3></div>` : ""}
              <div><h3>Teléfono: ${factura.numeroTelefono || ""}</h3></div>
            </div>
          </div>
        </div>

        <div class="dates-row">
          <div><strong>FECHA:</strong> ${factura.fechaFactura}</div>
          <div><strong>VENCIMIENTO:</strong> ${factura.fechaFactura}</div>
          <div><strong>OC:</strong> —</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>DESCRIPCIÓN</th>
              <th style="width: 8%">UNI.</th>
              <th style="width: 12%">Cantidad</th>
              <th style="width: 16%">P. UNITARIO</th>
              <th style="width: 16%">MONTO</th>
            </tr>
          </thead>
          <tbody>
            ${factura.servicios.map(s => {
              const desc = (s.nombre || '') + (s.detalle ? ' - ' + s.detalle : '');
              const precio = Number(s.precio) || 0;
              return `
                <tr>
                  <td>${desc}</td>
                  <td>UNID</td>
                  <td class="mono">1,000</td>
                  <td class="mono">${precio.toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td class="mono">${precio.toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${factura.descripcion ? `<div class="desc-box"><strong>DESCRIPCIÓN:</strong><div>${factura.descripcion}</div></div>` : ""}

        <div class="bottom-row">
          <div class="qr-block">
            <div class="qr-placeholder">QR</div>
            <div class="verif">Puede verificar comprobante en: https://ejemplo</div>
          </div>

          <div class="totals-block">
            <table>
              <tr><td>NETO IVA T BÁSICA</td><td class="mono">${(((Number(factura.total) || 0) / (factura.incluyeIva ? 1.22 : 1))).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
              <tr><td>IMPORTE IVA T BÁSICA (22%)</td><td class="mono">${(Number(factura.iva) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
              <tr><td>MONTO TOTAL</td><td class="mono">${(Number(factura.total) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
              <tr class="total-pagar"><td><strong>TOTAL A PAGAR</strong></td><td class="mono"><strong>$ ${(Number(factura.total) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td></tr>
            </table>
          </div>
        </div>
      </div>

      <script>
      (function(){
        function savePDF(){
          var cont = document.getElementById('factura_container');
          if(!cont || !window.html2pdf) return;
          var opt = {
            margin: 0,
            filename: 'factura_${factura.numeroFactura}.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
          };
          window.html2pdf().set(opt).from(cont).save();
        }
        if (window.html2pdf) savePDF();
        else document.addEventListener('DOMContentLoaded', savePDF);
      })();
      </script>
    </body>
    </html>
  `;

  const ventana = window.open("", "_blank");
  ventana.document.writeln(facturaHTML);
  ventana.document.close();
}

// ===== Confirm / Eliminar factura =====
function swalConfirm(onOk) {
  if (typeof Swal === "undefined") { if (confirm("¿Eliminar factura?")) onOk(); return; }
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción eliminará la factura",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => { if (result.isConfirmed) onOk(); });
}

function eliminarFactura(index) {
  swalConfirm(() => {
    const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
    facturas.splice(index, 1);
    localStorage.setItem("facturas", JSON.stringify(facturas));
    if (typeof Swal !== "undefined") {
      Swal.fire('¡Eliminada!', 'La factura fue eliminada correctamente.', 'success').then(() => location.reload());
    } else {
      alert('Eliminada'); location.reload();
    }
  });
}

// ===== Cuotas =====
function mostrarFormularioCuota(index) {
  const el = document.getElementById(`formCuota-${index}`);
  if (el) el.style.display = "block";
}

function actualizarCuota(index) {
  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
  const input = document.getElementById(`nuevaCuota-${index}`);
  const nuevaCuota = parseInt(input && input.value, 10);
  if (isNaN(nuevaCuota) || nuevaCuota < 1 || nuevaCuota > (facturas[index]?.cuotas || 1)) {
    if (typeof Swal !== "undefined") Swal.fire("Número de cuota inválido"); else alert("Número de cuota inválido");
    return;
  }
  facturas[index].cuotaActual = nuevaCuota;
  localStorage.setItem("facturas", JSON.stringify(facturas));
  if (typeof Swal !== "undefined") Swal.fire("Cuota actualizada correctamente");
  location.reload();
}

// ===== Descargar PDF (misma plantilla/estilos) =====
function descargarFacturaPDF(index) {
  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
  const factura = facturas[index];

  // Nodo temporal con la misma estructura que la vista
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div id="factura_container" class="ref-doc pdf" style="
      width:794px; min-height:auto; margin:0; padding:16px; border:none;
      background:#fff; /* evita transparencia */
    ">
      <div class="top-row">
        <div class="issuer-block">
          <div class="logo-box">
            <img src="./img/jslogo.png" alt="Logo" />
          </div>
            <div class="issuer-lines">
              <div class="issuer-name">JS AIRES PANDO</div>
              <div class="issuer-addr">Pando, Canelones - 093 365 696</div>
              <div class="issuer-site">www.aireacondicionadopando.com</div>
            </div>
        </div>
        <div class="ticket-block">
          <div class="ruc">RUT Emisor: <span class="mono">${factura.rut || ""}</span></div>
          <div class="ticket-title">E-TICKET</div>
          <table class="ticket-meta">
            <tr><th>Serie</th><th>Número</th><th>Pago</th><th>Moneda</th></tr>
            <tr>
              <td>A</td>
              <td class="mono">${factura.numeroFactura}</td>
              <td>${(factura.tipoPago || "").toUpperCase()}</td>
              <td>UYU</td>
            </tr>
          </table>
          <div class="consumo">CONSUMO FINAL:<div class="mono">0</div></div>
            <div class="cliente-mini">
              <div><h3>Cliente: ${factura.nombreCliente || ""}</h3></div>
              ${factura.empresaCliente ? `<div><h3>Empresa: ${factura.empresaCliente}</h3></div>` : ""}
              ${factura.rutCliente ? `<div><h3>RUT: ${factura.rutCliente}</h3></div>` : ""}
              <div><h3>Teléfono: ${factura.numeroTelefono || ""}</h3></div>
            </div>
        </div>
      </div>

      <div class="dates-row">
        <div><strong>FECHA:</strong> ${factura.fechaFactura || ""}</div>
        <div><strong>VENCIMIENTO:</strong> ${factura.fechaFactura || ""}</div>
        <div><strong>OC:</strong> —</div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>DESCRIPCIÓN</th>
            <th style="width: 8%">UNI.</th>
            <th style="width: 12%">Cantidad</th>
            <th style="width: 16%">P. UNITARIO</th>
            <th style="width: 16%">MONTO</th>
          </tr>
        </thead>
        <tbody>
          ${factura.servicios.map(s => {
            const desc = (s.nombre || '') + (s.detalle ? ' - ' + s.detalle : '');
            const precio = Number(s.precio) || 0;
            return `
              <tr>
                <td>${desc}</td>
                <td>UNID</td>
                <td class="mono">1,000</td>
                <td class="mono">${precio.toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="mono">${precio.toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      ${factura.descripcion ? `<div class="desc-box"><strong>DESCRIPCIÓN:</strong><div>${factura.descripcion}</div></div>` : ""}

      <div class="bottom-row">
        <div class="qr-block">
          <div class="qr-placeholder">QR</div>
          <div class="verif">Puede verificar comprobante en: https://ejemplo</div>
        </div>
        <div class="totals-block">
          <table>
            <tr><td>NETO IVA T BÁSICA</td><td class="mono">${(((Number(factura.total) || 0) / (factura.incluyeIva ? 1.22 : 1))).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr><td>IMPORTE IVA T BÁSICA (22%)</td><td class="mono">${(Number(factura.iva) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr><td>MONTO TOTAL</td><td class="mono">${(Number(factura.total) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            <tr class="total-pagar"><td><strong>TOTAL A PAGAR</strong></td><td class="mono"><strong>$ ${(Number(factura.total) || 0).toLocaleString('es-UY', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  // Adjuntar CSS (y esperar a que cargue)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './CSS/factura_ref.css';
  wrapper.prepend(link);

  // Estilos “duros” para el render del PDF (no tocan tu CSS global)
  const hardCSS = document.createElement('style');
  hardCSS.textContent = `
    .ref-doc, .ref-doc * { color:#000 !important; }
    .issuer-name, h1, h2, h3, th, .fw-bold { font-weight:700 !important; }
    body, td, p, li, div, span { font-weight:400 !important; }
  `;
  wrapper.prepend(hardCSS);

  const ensureHtml2pdf = () => new Promise((resolve) => {
    if (window.html2pdf) return resolve();
    const s = document.createElement('script');
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.onload = resolve;
    document.body.appendChild(s);
  });

  // Esperar CSS, fuentes e imágenes antes de exportar
  const waitStyles = new Promise(res => (link.onload ? link.onload = res : res()));
  const waitFonts = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(()=>{}) : Promise.resolve();
  const waitImages = Promise.all(
    Array.from(wrapper.querySelectorAll('img')).map(img =>
      img.complete ? Promise.resolve() :
      new Promise(r => { img.onload = img.onerror = r; })
    )
  );

  Promise.all([ensureHtml2pdf(), waitStyles, waitFonts, waitImages]).then(() => {
    const opciones = {
      margin: 0,
      filename: `factura_${factura.numeroFactura}.pdf`,
      image: { type: 'png', quality: 1 },                   // ← PNG nítido
      html2canvas: { scale: 3, letterRendering: true, useCORS: true }, // ← más nitidez
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    window.html2pdf().set(opciones).from(wrapper).save();
  });
}

