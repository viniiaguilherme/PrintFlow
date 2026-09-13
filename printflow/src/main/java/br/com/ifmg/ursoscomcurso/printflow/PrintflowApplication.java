package br.com.ifmg.ursoscomcurso.printflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;

@SpringBootApplication	
// @Profile("application-dev")

public class PrintflowApplication {

	public static void main(String[] args) {
		SpringApplication.run(PrintflowApplication.class, args);
	}

}
