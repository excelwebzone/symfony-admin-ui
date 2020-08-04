import $ from 'jquery';
import EntityDrawer from '../entity_drawer';
import EntityModal from '../entity_modal';
import EntityForm from '../entity_form';
import EntityView from '../entity_view';
import Datagrid from './components/datagrid';
import BlockRequest from './components/block_request';
import ToggleObject from './components/toggle_object';

document.addEventListener('DOMContentLoaded', () => {
  new EntityModal();
  new EntityDrawer();
  new EntityForm();
  new EntityView();
  new BlockRequest();
  new ToggleObject();

  for (let element of $('.import-table-panel,.report-table-component')) {
    new Datagrid($(element).find('.js-datagrid'));
  }
});
