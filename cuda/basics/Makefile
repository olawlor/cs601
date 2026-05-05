NVCC=nvcc
NVCCFLAGS=-Xlinker -R/usr/local/cuda/lib 

# See your source code intermixed with assembly, and a whole lotta other crap:
# NVCCFLAGS+=-keep --opencc-options -LIST:source=on

all: main

main: main.cu
	$(NVCC) $(NVCCFLAGS) $< -o $@

clean:
	rm main
