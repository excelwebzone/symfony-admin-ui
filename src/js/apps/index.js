import $ from 'jquery';
import EntityDrawer from '../entity_drawer';
import EntityModal from '../entity_modal';
import EntityForm from '../entity_form';
import EntityView from '../entity_view';
import EmberTable from './components/ember_table';
import BlockRequest from './components/block_request';

document.addEventListener('DOMContentLoaded', () => {
  new EntityModal();
  new EntityDrawer();
  new EntityForm();
  new EntityView();
  new BlockRequest();

  for (let element of $('.import-table-panel,.report-table-component')) {
    new EmberTable($(element).find('.js-ember-table'));
  }
});
