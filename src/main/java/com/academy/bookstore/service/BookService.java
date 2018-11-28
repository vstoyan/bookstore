package com.academy.bookstore.service;

import com.academy.bookstore.model.Book;
import com.academy.bookstore.repository.BookRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    private BookRepository bookRepository;

    @Autowired
    public BookService(BookRepository bookRepository){
        this.bookRepository = bookRepository;
    }

    public void createBook(Book book){
        bookRepository.save(book);
    }

    public List<Book> findAll(){
        return bookRepository.findAll();
    }

    public Book getBookById(Long id){
       return bookRepository.getOne(id);
    }



}
