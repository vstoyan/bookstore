package com.academy.bookstore.controller;

import com.academy.bookstore.model.Book;
import com.academy.bookstore.service.BookService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class BookController {

    private BookService bookService;

    public BookController(BookService bookService){
        this.bookService = bookService;
    }

    @PostMapping("/book")
    @ResponseBody
    public ResponseEntity<?> createBook(@RequestBody Book book){
        bookService.createBook(book);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/book/{id}")
    @ResponseBody
    public ResponseEntity<?> getBookById(@PathVariable Long id){
        Book result = bookService.getBookById(id);
        if (result !=null){
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/books")
    @ResponseBody
    public ResponseEntity<List<Book>> findAllBooks(){
        return ResponseEntity.ok(bookService.findAll());
    }

    @GetMapping("/welcome")
    public String index() {
        return "index";
    }
}
