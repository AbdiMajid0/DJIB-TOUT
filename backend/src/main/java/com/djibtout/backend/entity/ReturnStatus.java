package com.djibtout.backend.entity;
// CANCELLED est le retrait de la demande par l'acheteur lui-meme, avant que le
// vendeur ne se prononce. Il est volontairement absent de la liste qui bloque
// une nouvelle demande sur le meme article : annuler doit permettre de redemander.
public enum ReturnStatus { REQUESTED, APPROVED, REJECTED, RECEIVED, REFUNDED, CANCELLED }
