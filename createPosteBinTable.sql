drop table paste_list ;

create table paste_list (
  id serial primary key,
  title char(255) default '',
  content char(255) not null,
  date timestamp default current_timestamp
)