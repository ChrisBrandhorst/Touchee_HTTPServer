<div class="content_container content_container_full" id="content_page_2" style="display:none"></div>
<div class="content_container content_container_full" id="content_page_1"></div>

<div id="artwork_selection" class="selection" style="display:none"></div>
<div id="row_selection" class="selection" style="display:none"><div></div></div>
<ul id="alphabet" style="display:none"></ul>



<script id="albumTemplate" type="text/x-jquery-tmpl">
  <div class="content_container album" data-container-type="album" data-content-type="tracks">
    <h1>
      ${name}<br/>${artist}
      <span>${tracks.length} song${tracks.length > 1 ? 's' : ''}</span>
    </h1>
    <div>
      <table>
      {{each tracks}}
        <tr data-id="${$value[0]}">
          <td>${$value[2]}</td>
          <td>${$value[1]}</td>
          <td>${$value[3]}</td>
        </tr>
      {{/each}}
      </table>
    </div>
  </div>
</script>