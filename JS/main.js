document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("invoiceForm")
    const tipoPagoSelect = document.getElementById("tipoPago");


    form.addEventListener("submit", (e) => {
        e.preventDefault()

        
        // Validar que si elige 'otros' debe completar el campo
        const selectsOtros = document.querySelectorAll("select[name='equipoDetail'], select[name='instalacionDetail']");
        for (let sel of selectsOtros) {
            if (sel.value === "otros") {
                const otroInput = sel.closest('.servicio').querySelector("input.detalle-otro");
                if (!otroInput || !otroInput.value.trim()) {
                    alert("Por favor especifica el tamaño cuando selecciones 'otros' en " + sel.name);
                    return;
                }
            }
        }
    
        const factura = crearFacturaDesdeFormulario()

        guardarFactura(factura)
        mostrarFactura(factura)

    })

    tipoPagoSelect.addEventListener("change", (e) => {
        const cuotasDiv = document.getElementById("cuotasContainer")
        if (tipoPagoSelect.value === "cuota") {
            cuotasDiv.style.display = "block"
        } else {
            cuotasDiv.style.display = "none"
        }
    })
})    

// Crea la factura con los campos que se llenen 
function crearFacturaDesdeFormulario() {
    const  numeroFactura = document.getElementById("numeroFactura").value
    const  nombreCliente = document.getElementById("nombreCliente").value
    const numeroTelefono = document.getElementById("numeroTelefono").value
    const fechaFactura = document.getElementById("fechaFactura").value
    const incluyeRut = document.getElementById("incluyeRut").checked
    const rut = incluyeRut ? document.getElementById("rut").value : "";
    const incluyeIva = document.getElementById("incluyeIva").checked
    const tipoPago = document.getElementById("tipoPago").value
    const cuotas = tipoPago === "cuota" ? parseInt(document.getElementById("cuotas").value) : 1
    const descripcion = document.getElementById("descripcion").value

    const rutCliente = document.getElementById('rutCliente') ? document.getElementById('rutCliente').value : ''
    const empresaCliente = document.getElementById('empresaCliente') ? document.getElementById('empresaCliente').value : ''


    const servicios = [] 

    document.querySelectorAll(".servicio").forEach(servicioDiv => {
        const checkbox = servicioDiv.querySelector("input[type='checkbox']")
        if (checkbox.checked) {
            const nombre = checkbox.value
            const inputPrecio = servicioDiv.querySelector("input[type='number']")
            const selectDetalle = servicioDiv.querySelector('select')
            const textInputs = Array.from(servicioDiv.querySelectorAll("input[type='text']"))
            const precio = inputPrecio ? parseFloat(inputPrecio.value) || 0 : 0 
            const partes = []
            if (selectDetalle && selectDetalle.value !== 'otros') partes.push(selectDetalle.value)
            textInputs.forEach(inp => { const val = (inp.value || '').trim(); if (val) { partes.push((inp.dataset.label ? (inp.dataset.label + ': ') : '') + val) } })
            const detalle = partes.join(' | ')

            servicios.push({
                nombre,
                precio,
                detalle
            })
        }
    })

    let total = servicios.reduce((sum, s) => sum + s.precio, 0)
    let ivaCalculado = 0
    if (incluyeIva) {
        ivaCalculado = total * 0.22
        total *= 1.22 
    }

    return {
        numeroFactura,
        nombreCliente,
        numeroTelefono,
        fechaFactura,
        rut,
        incluyeIva,
        tipoPago,
        cuotas,
        descripcion,
        rutCliente,
        empresaCliente,
        servicios,
        total: total.toFixed(2),
        iva: ivaCalculado.toFixed(2),
    }
}

// Guarda la factura
function guardarFactura(factura) {
    const facturasGuardadas = JSON.parse(localStorage.getItem("facturas")) || []
    facturasGuardadas.unshift(factura)
    localStorage.setItem("facturas", JSON.stringify(facturasGuardadas))
}

// Muestra la factura creada en uan nueva ventana



function mostrarFactura(factura) {
  const facturaHTML = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura ${factura.numeroFactura}</title>
      <link rel="stylesheet" href="./CSS/factura_ref.css">
      <link rel="stylesheet" href="./CSS/styles.css">
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

// === setupRutEmpresaToggle ===
function setupRutEmpresaToggle() {
    const chk = document.getElementById('toggleRutEmpresa');
    const box = document.querySelector('.reparacion-extra');
    if (!chk || !box) return;
    const update = () => { box.style.display = chk.checked ? 'block' : 'none'; };
    chk.addEventListener('change', update);
    update(); // init on load
}

document.addEventListener("DOMContentLoaded", () => {
    try { setupRutEmpresaToggle(); } catch(e) { console.warn('rut/empresa toggle error', e); }
});


// === setupServiciosUI ===
function setupServiciosUI() {
  document.querySelectorAll('.servicio').forEach(serv => {
    const cb = serv.querySelector('input[type="checkbox"]');
    const inputsBox = serv.querySelector('.inputs');
    const toggle = () => {
      const enabled = cb && cb.checked;
      serv.classList.toggle('active', enabled);
      serv.classList.toggle('disabled', !enabled);
      if (!inputsBox) return;
      inputsBox.querySelectorAll('input,select,textarea').forEach(inp => { inp.disabled = !enabled; });
    };
    if (cb) { cb.addEventListener('change', toggle); toggle(); }
  });

  // cuotas show/hide with class for transition
  const sel = document.getElementById('tipoPago');
  const cuotasBox = document.getElementById('cuotasContainer');
  if (sel && cuotasBox) {
    const upd = () => { 
      const isCuota = sel.value === 'cuota';
      cuotasBox.classList.toggle('show', isCuota);
      cuotasBox.style.display = isCuota ? 'block' : 'none';
    };
    sel.addEventListener('change', upd);
    upd();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try { setupServiciosUI(); } catch(e) { console.warn('setupServiciosUI error', e); }
});


// === setupLiveSummary ===
function setupLiveSummary() {
  const form = document.getElementById('invoiceForm');
  if (!form) return;

  const fmt = (n) => (isNaN(n) ? 0 : n).toLocaleString('es-UY', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const calc = () => {
    // Sum selected services' prices
    let subtotal = 0;
    document.querySelectorAll('.servicio').forEach(serv => {
      const cb = serv.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        const price = serv.querySelector('input[type="number"]');
        const val = price ? parseFloat(price.value) : 0;
        subtotal += (isNaN(val) ? 0 : val);
      }
    });

    const incluyeIva = document.getElementById('incluyeIva')?.checked || false;
    const tipoPago = (document.getElementById('tipoPago')?.value || '').toLowerCase();
    const cuotas = tipoPago === 'cuota' ? parseInt(document.getElementById('cuotas')?.value || '1') : 1;

    let iva = 0, total = subtotal;
    if (incluyeIva) {
      iva = subtotal * 0.22;
      total = subtotal * 1.22;
    }

    // Update UI
    const elSub = document.getElementById('live-subtotal');
    const elIva = document.getElementById('live-iva');
    const elTot = document.getElementById('live-total');
    const rowCuotas = document.getElementById('live-cuotas-row');
    const elCuotaMonto = document.getElementById('live-cuota-monto');

    if (elSub) elSub.textContent = '$ ' + fmt(subtotal);
    if (elIva) elIva.textContent = '$ ' + fmt(iva);
    if (elTot) elTot.textContent = '$ ' + fmt(total);

    if (rowCuotas && elCuotaMonto) {
      if (cuotas > 1) {
        rowCuotas.style.display = 'flex';
        const porCuota = total / cuotas;
        elCuotaMonto.textContent = `${cuotas} x $ ${fmt(porCuota)}`;
      } else {
        rowCuotas.style.display = 'none';
      }
    }
  };

  // Listen to changes across the whole form
  form.addEventListener('input', calc, true);
  form.addEventListener('change', calc, true);
  // Initial run
  calc();
}

document.addEventListener('DOMContentLoaded', () => {
  try { setupLiveSummary(); } catch(e) { console.warn('setupLiveSummary error', e); }
});


// === setupSelectOtros added ===

function setupSelectOtros() {
  const selects = Array.from(document.querySelectorAll("select[name='equipoDetail'], select[name='instalacionDetail']"));
  const ensureInput = (select) => {
    const servicio = select.closest('.servicio') || select.parentElement;
    const inputsBox = servicio.querySelector('.inputs') || servicio;
    let existing = servicio.querySelector('input.detalle-otro');
    if (select.value === 'otros') {
      if (!existing) {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = select.name + 'Otro';
        input.placeholder = 'Especificar tamaño';
        input.className = 'detalle-otro';
        input.setAttribute('data-label', 'Tamaño');
        input.required = true;
        if (select.nextSibling) select.parentNode.insertBefore(input, select.nextSibling);
        else inputsBox.appendChild(input);
      } else {
        existing.required = true;
      }
    } else {
      if (existing) { existing.required = false; existing.remove(); }
    }
    const cb = servicio.querySelector('input[type="checkbox"]');
    if (cb && inputsBox) {
      const enabled = cb.checked;
      inputsBox.querySelectorAll('input,select,textarea').forEach(inp => { inp.disabled = !enabled; });
    }
  };
  selects.forEach(select => {
    select.addEventListener('change', () => ensureInput(select));
    ensureInput(select);
  });
}
// Hook it into DOMContentLoaded



document.addEventListener('DOMContentLoaded', () => { try { setupSelectOtros(); } catch(e) { console.warn('setupSelectOtros error', e); } });
