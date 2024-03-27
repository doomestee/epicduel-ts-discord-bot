// export default class InventoryListSet {
//     constructor() {
//         /**
//          * @type {import("./InventoryListItem")}
//          */
//         this.selectedItem = null;
//         this.lists = [];
//         this.equipLists = [];
//         this.selectedList = [];
//     }

//     addList(list, equip) {
//         if (equip) this.equipLists.push(list);
//         this.lists.push(list);
//     }

//     deselectAllExcept(list) {
//         for (let i = 0; i < this.lists.length; i++) {
//             if (this.lists[i] != list) {
//                 this.lists[i].selectedIndex = -1;
//                 this.lists[i].selectedItem = null;
//             } else {
//                 this.selectedList = list;
//                 this.selectedItem = list.selectedItem;
//             }
//         }
//     }

//     deselectAll() {
//         for (let i = 0; i < this.lists.length; i++) {
//             this.lists[i].selectedIndex = -1;
//             this.lists[i].selectedItem = null;
//         }

//         this.selectedList = null; this.selectedItem null;
//     }

//     isSelectedItemEquipped() {
//         for (let c = 0; c < this.equipLists.length; c++) {
//             if (this.equipLists[c].selectedIndex != -1) return true;
//         } return false;
//     }

//     removeSelectionFromEquipLists() {
//         for (let c = 0; c < this.equipLists.length; c++) {
//             this.equipLists[c].selectedItem = null;
//         } return false;
//     }

//     selectFirstItemInList() {
//         if (list.length > 0) {
//             list.selectedIndex = 0;
//         }
//     }
// }
      
//       public function selectFirstItemInList(list:List) : *
//       {
//          if(list.dataProvider.length > 0)
//          {
//             list.selectedIndex = 0;
//             list.scrollToIndex(list.selectedIndex);
//             if(list.selectedItem != null)
//             {
//                if(list.selectedItem.itemRecord == null)
//                {
//                   list.selectedIndex = 1;
//                   list.scrollToIndex(list.selectedIndex);
//                }
//             }
//             this.deselectAllExcept(list);
//             return this.selectedItem;
//          }
//          return null;
//       }
      
//       public function selectItemByCharInvId(list:List, charInvId:int) : *
//       {
//          var listItem:InventoryListItem = null;
//          for(var k:int = 0; k < list.dataProvider.length; k++)
//          {
//             listItem = list.dataProvider.getItemAt(k) as InventoryListItem;
//             if(listItem.charInvId == charInvId)
//             {
//                list.selectedItem = listItem;
//                list.scrollToSelected();
//                this.deselectAllExcept(list);
//                return this.selectedItem;
//             }
//          }
//          return null;
//       }
      
//       public function selectItemByIndex(list:List, index:int) : *
//       {
//          var newIndex:int = index - 1 >= 0 ? index - 1 : index;
//          if(newIndex > list.length - 1)
//          {
//             return null;
//          }
//          list.selectedIndex = newIndex;
//          this._selectedItem = list.selectedItem as InventoryListItem;
//          this._selectedList = list;
//          return this.selectedItem;
//       }
      
//       public function setSelectedItem(list:List, item:InventoryListItem) : void
//       {
//          list.selectedItem = item;
//          list.scrollToIndex(list.selectedIndex);
//          this._selectedItem = item;
//          this._selectedList = list;
//       }
      
//       public function get selectedItem() : InventoryListItem
//       {
//          return this._selectedItem;
//       }
//    }
// }
