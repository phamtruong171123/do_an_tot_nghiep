alter table conversation drop column avatarUrl;

select * from customer;

delete from customer;


delete from message ;
delete from conversation;


alter table conversation add column unreadCount Int default 0;




SET SQL_SAFE_UPDATES = 0;

delete from ticket;